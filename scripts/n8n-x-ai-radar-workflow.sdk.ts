import {
  workflow,
  node,
  trigger,
  sticky,
  splitInBatches,
  nextBatch,
  expr,
  newCredential,
} from '@n8n/workflow-sdk';

const ACCOUNTS = [
  'krea_ai',
  'LTXStudio',
  'testingcatalog',
  'grok',
  'TencentHunyuan',
  'Baidu_Inc',
  'ZaiOrg',
  'MicrosoftAI',
  'NVIDIAAI',
  'MistralAI',
  'AIatMeta',
  'Docker',
  'coolifyio',
  'SD_Tutorial',
  'aisearchio',
  'ErnieForDevs',
  'apify',
  'LumaLabsAI',
  'ArtificialAnlys',
  'NousResearch',
  'xai',
  'ComfyUI',
  'n8n_io',
  'higgsfield',
  'googlegemma',
  'geminicli',
  'ElevenLabs',
  'ManusAI',
  'LocalAIApp',
  'deepseek_ai',
  'Kling_ai',
  'Kimi_Moonshot',
  'cursor_ai',
  'ollama',
  'NotebookLM',
  'open_claw',
  'lmstudio',
  'LocallyAIApp',
  'GoogleAIStudio',
  'openart_ai',
  'GoogleAI',
  'atomic_chat_hq',
  'atomicbot_ai',
  'huggingface',
  'arena',
  'MiniMax_ai',
  'OpenRouter',
  'perplexity_ai',
  'Alibaba_Qwen',
  'OpenAI',
  'AnthropicAI',
  'ClaudeApp',
  'GeminiApp',
  'GoogleLabs',
  'stitchbygoogle',
];

const CONFIG_JSON = JSON.stringify({
  accounts: ACCOUNTS,
  timezone: 'America/Mexico_City',
  maxPostsPerAccount: 1,
  maxResultsPerRequest: 10,
});

const N8N_TZ_HELPER = `function n8nStartOfTodayInZone(timeZone) {
  const dayKey = new Intl.DateTimeFormat('en-CA', { timeZone }).format(Date.now());
  const [y, mo, da] = dayKey.split('-').map((n) => parseInt(n, 10));
  const fmt = (ms) => {
    const p = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).formatToParts(new Date(ms));
    const g = (t) => p.find((x) => x.type === t).value;
    return {
      dayKey: g('year') + '-' + g('month') + '-' + g('day'),
      hour: parseInt(g('hour'), 10),
      minute: parseInt(g('minute'), 10),
    };
  };
  let startMs = Date.UTC(y, mo - 1, da, 12, 0, 0);
  for (let i = 0; i < 48; i++) {
    const probe = startMs - i * 3600000;
    const f = fmt(probe);
    if (f.dayKey === dayKey && f.hour === 0 && f.minute === 0) {
      startMs = probe;
      break;
    }
  }
  const iso = new Date(startMs).toISOString();
  const startTimeIso = iso.indexOf('.') !== -1 ? iso.slice(0, iso.indexOf('.')) + 'Z' : iso;
  return { dayKey, startTimeIso, startMs };
}
function n8nParseIsoUtcMs(iso) {
  return Date.parse(iso);
}
function n8nNowIso() {
  return new Date().toISOString();
}
`;

const EXPAND_ACCOUNTS_JS = `${N8N_TZ_HELPER}
const config = $input.first().json;
const accounts = (config.accounts || []).map((u) => String(u).replace(/^@/, '').trim()).filter(Boolean);
const tz = config.timezone || 'America/Mexico_City';
const { dayKey, startTimeIso } = n8nStartOfTodayInZone(tz);
const maxResults = Math.min(100, Math.max(10, Number(config.maxResultsPerRequest) || 10));

return accounts.map((username) => ({
  json: {
    username,
    query: 'from:' + username + ' -is:retweet -is:reply -is:quote',
    start_time: startTimeIso,
    startOfTodayIso: startTimeIso,
    dayKey,
    timezone: tz,
    max_results: maxResults,
    maxPostsPerAccount: Number(config.maxPostsPerAccount) || 1,
  },
}));`;

const PICK_TODAY_JS = `${N8N_TZ_HELPER}
const res = $input.first().json;
const src = ($('Expand accounts').item || $('Expand queries').item).json;
const username = (src.username || '').toLowerCase();
const startMs = n8nParseIsoUtcMs(src.startOfTodayIso);
const tweets = res.data || [];
const users = {};
for (const u of res.includes?.users || []) users[u.id] = u;

function exclusionReason(tw) {
  const refs = tw.referenced_tweets || [];
  for (const r of refs) {
    if (r.type === 'retweeted') return 'retweet';
    if (r.type === 'replied_to') return 'reply';
    if (r.type === 'quoted') return 'quote';
  }
  const text = (tw.text || '').trim();
  if (/^RT\\s@/i.test(text)) return 'retweet_text';
  if (/^@\\w+\\s/.test(text) && !text.includes('\\n') && text.length < 120) return 'likely_reply';
  return null;
}

const todayRows = [];
for (const tw of tweets) {
  if (!tw.created_at) continue;
  const createdMs = n8nParseIsoUtcMs(tw.created_at);
  if (createdMs < startMs) continue;
  const user = users[tw.author_id] || {};
  if ((user.username || '').toLowerCase() !== username) continue;
  todayRows.push({ tw, user, createdMs });
}

todayRows.sort((a, b) => b.createdMs - a.createdMs);

const discarded = [];
let picked = null;
for (const row of todayRows) {
  const reason = exclusionReason(row.tw);
  if (reason) {
    discarded.push({ post_id: row.tw.id, excluded_reason: reason });
    continue;
  }
  picked = row;
  break;
}

if (!picked) return [];

return [
  {
    json: {
      data: [picked.tw],
      includes: { users: [picked.user] },
      username: src.username,
      dayKey: src.dayKey,
      startOfTodayIso: src.startOfTodayIso,
      is_original: true,
      _pickStats: { scanned: todayRows.length, discarded },
    },
  },
];`;

const NORMALIZE_JS = `${N8N_TZ_HELPER}
const items = $input.all();
const out = [];

function firstUrl(entities) {
  const urls = entities?.urls;
  if (!urls?.length) return '';
  return (
    urls.find((u) => u.expanded_url && !u.expanded_url.includes('t.co'))?.expanded_url ||
    urls[0].expanded_url ||
    ''
  );
}

function editorialTitle(text, username) {
  const t = (text || '').replace(/\\s+/g, ' ').trim();
  if (!t.length) return 'Novedad de IA en @' + username;
  if (t.length <= 100) return t;
  return '@' + username + ': ' + t.slice(0, 88) + '…';
}

function buildRawText(text, username, externalUrl) {
  const t = (text || '').replace(/\\s+/g, ' ').trim().slice(0, 1200);
  const parts = ['@' + username + ' publicó hoy en X sobre IA/tecnología.'];
  if (t) parts.push('Resumen: ' + t);
  if (externalUrl) parts.push('Enlace: ' + externalUrl);
  return parts.join(' ').slice(0, 1500);
}

for (const item of items) {
  const tw = (item.json.data || [])[0];
  if (!tw) continue;
  const user = (item.json.includes?.users || [])[0] || {};
  const username = item.json.username || user.username || 'unknown';
  const postId = tw.id;
  const text = tw.text || '';
  const externalUrl = firstUrl(tw.entities);
  const xCreated = tw.created_at || new Date().toISOString();

  out.push({
    json: {
      category: 'ia',
      source_name: 'X',
      source_url: 'https://x.com/' + username + '/status/' + postId,
      title: editorialTitle(text, username),
      raw_text: buildRawText(text, username, externalUrl),
      detected_at: n8nNowIso(),
      metadata: {
        platform: 'x',
        signal_type: 'ai_trend',
        author: user.name || '',
        username,
        post_id: postId,
        x_created_at: xCreated,
        dayKey: item.json.dayKey,
        likes: tw.public_metrics?.like_count ?? 0,
        reposts: tw.public_metrics?.retweet_count ?? 0,
        replies: tw.public_metrics?.reply_count ?? 0,
        quotes: tw.public_metrics?.quote_count ?? 0,
        relevance_reason: 'Último post original de hoy (catálogo radar X)',
        external_url: externalUrl,
        from_key_account: true,
        is_original: true,
      },
    },
  });
}

return out;`;

const EDITORIAL_FILTER_JS = `const ARXIV = /arxiv\\.org|arxiv/i;
const PROMO = /\\b(buy now|limited time|use code|descuento|promo|sponsored|#ad)\\b/i;
const items = $input.all();
const kept = [];

for (const item of items) {
  const j = item.json;
  const meta = j.metadata || {};
  const text = (j.title || '') + ' ' + (j.raw_text || '') + ' ' + (meta.external_url || '');

  if (meta.is_original === false) continue;
  if (ARXIV.test(text)) continue;

  const raw = (j.raw_text || '').trim();
  if (raw.length < 12) continue;

  if (PROMO.test(text) && raw.length < 100 && !meta.external_url) continue;

  kept.push({ json: j });
}

return kept;`;

const DEDUPE_JS = `const staticData = $getWorkflowStaticData('global');
const dayKey =
  $input.first().json.metadata?.dayKey ||
  ($('Expand accounts').first() || $('Expand queries').first()).json.dayKey ||
  'unknown';

if (!staticData.ingestedPostIds) staticData.ingestedPostIds = {};
if (!staticData.ingestedPostIds[dayKey]) staticData.ingestedPostIds[dayKey] = [];

const sentToday = new Set(staticData.ingestedPostIds[dayKey]);
const seenIds = new Set();
const seenUrls = new Set();
const out = [];

for (const item of $input.all()) {
  const meta = item.json.metadata || {};
  const postId = meta.post_id;
  const sourceUrl = item.json.source_url;
  if (!postId) continue;
  if (sentToday.has(postId) || seenIds.has(postId)) continue;
  if (sourceUrl && seenUrls.has(sourceUrl)) continue;
  seenIds.add(postId);
  if (sourceUrl) seenUrls.add(sourceUrl);
  sentToday.add(postId);
  out.push(item);
}

staticData.ingestedPostIds[dayKey] = [...sentToday];
const keys = Object.keys(staticData.ingestedPostIds).sort();
if (keys.length > 14) {
  for (const k of keys.slice(0, keys.length - 14)) delete staticData.ingestedPostIds[k];
}

return out;`;

const LOG_SUMMARY_JS = `${N8N_TZ_HELPER}
const accounts = $('Set config').first().json.accounts || [];
const expandNode = $('Expand accounts').first() || $('Expand queries').first();
const dayKey = expandNode.json.dayKey;
const startIso = expandNode.json.startOfTodayIso;
const maxResults = Number(expandNode.json.max_results) || 10;

const searchItems = $('X API Recent Search').all();
let postsReceived = 0;
for (const item of searchItems) {
  postsReceived += (item.json.data || []).length;
}

const picked = $('pickTodayPost').all().length;
const normalized = $('normalizeXPosts').all().length;
const afterEditorial = $('editorialFilter').all().length;
const ingested = $('dedupe').all().length;
const postsRequested = accounts.length * maxResults;
const postsFiltered = Math.max(0, postsReceived - ingested);
const duplicatesSkipped = Math.max(0, afterEditorial - ingested);
const startedAt = $execution.startedAt || startIso;

return [
  {
    json: {
      provider: 'x',
      workflow_name: 'Notitendencias - X AI Radar',
      run_type: 'scheduled',
      started_at: startedAt,
      finished_at: n8nNowIso(),
      status: 'success',
      posts_requested: postsRequested,
      posts_received: postsReceived,
      posts_filtered: postsFiltered,
      posts_sent_to_ingest: ingested,
      duplicates_skipped: duplicatesSkipped,
      errors_count: 0,
      metadata: {
        queries_used: accounts.slice(0, 20),
        accounts_checked: accounts,
        timezone: 'America/Mexico_City',
        dayKey,
        catalogAccounts: accounts.length,
        accountsWithPostToday: picked,
        normalizedCandidates: normalized,
        note: 'Solo posts desde inicio del día CDMX; máx. 1 por cuenta.',
      },
    },
  },
];`;

const manualTrigger = trigger({
  type: 'n8n-nodes-base.manualTrigger',
  version: 1,
  config: { name: 'Manual Trigger (tests)', position: [0, 280] },
  output: [{}],
});

const cron1045 = trigger({
  type: 'n8n-nodes-base.scheduleTrigger',
  version: 1.3,
  config: {
    name: 'Cron 10:45 CDMX',
    position: [0, 80],
    parameters: {
      rule: { interval: [{ field: 'days', triggerAtHour: 10, triggerAtMinute: 45 }] },
    },
  },
  output: [{}],
});

const cron1545 = trigger({
  type: 'n8n-nodes-base.scheduleTrigger',
  version: 1.3,
  config: {
    name: 'Cron 15:45 CDMX',
    position: [0, 180],
    parameters: {
      rule: { interval: [{ field: 'days', triggerAtHour: 15, triggerAtMinute: 45 }] },
    },
  },
  output: [{}],
});

const setConfig = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'Set config',
    position: [260, 180],
    parameters: { mode: 'raw', jsonOutput: CONFIG_JSON },
  },
  output: [{ accounts: ['OpenAI'], timezone: 'America/Mexico_City', maxPostsPerAccount: 1 }],
});

const expandAccounts = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Expand accounts',
    position: [500, 180],
    parameters: { mode: 'runOnceForAllItems', jsCode: EXPAND_ACCOUNTS_JS },
  },
  output: [
    {
      username: 'OpenAI',
      query: 'from:OpenAI -is:retweet -is:reply -is:quote',
      start_time: '2026-05-15T06:00:00Z',
      dayKey: '2026-05-15',
      max_results: 10,
    },
  ],
});

const xApiSearch = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'X API Recent Search',
    position: [740, 180],
    credentials: { httpHeaderAuth: newCredential('X API Bearer') },
    parameters: {
      method: 'GET',
      url: 'https://api.x.com/2/tweets/search/recent',
      authentication: 'genericCredentialType',
      genericAuthType: 'httpHeaderAuth',
      sendQuery: true,
      queryParameters: {
        parameters: [
          { name: 'query', value: expr('{{ $json.query }}') },
          { name: 'start_time', value: expr('{{ $json.start_time }}') },
          { name: 'max_results', value: expr('{{ $json.max_results }}') },
          {
            name: 'tweet.fields',
            value:
              'public_metrics,created_at,author_id,entities,referenced_tweets,conversation_id',
          },
          { name: 'expansions', value: 'author_id' },
          { name: 'user.fields', value: 'username,name' },
        ],
      },
    },
  },
  output: [
    {
      data: [
        {
          id: '1',
          text: 'New AI tool launch',
          author_id: 'u1',
          created_at: '2026-05-15T14:00:00.000Z',
        },
      ],
      includes: { users: [{ id: 'u1', username: 'OpenAI', name: 'OpenAI' }] },
    },
  ],
});

const pickTodayPost = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'pickTodayPost',
    position: [980, 180],
    parameters: { mode: 'runOnceForEachItem', jsCode: PICK_TODAY_JS },
  },
  output: [
    {
      data: [{ id: '1', text: 'New AI tool launch', author_id: 'u1', created_at: '2026-05-15T14:00:00.000Z' }],
      includes: { users: [{ id: 'u1', username: 'OpenAI', name: 'OpenAI' }] },
      username: 'OpenAI',
      dayKey: '2026-05-15',
    },
  ],
});

const normalizeXPosts = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'normalizeXPosts',
    position: [1220, 180],
    parameters: { mode: 'runOnceForAllItems', jsCode: NORMALIZE_JS },
  },
  output: [
    {
      category: 'ia',
      source_name: 'X',
      source_url: 'https://x.com/OpenAI/status/1',
      title: 'New AI tool launch',
      metadata: { post_id: '1', username: 'OpenAI', x_created_at: '2026-05-15T14:00:00.000Z' },
    },
  ],
});

const editorialFilter = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'editorialFilter',
    position: [1460, 180],
    parameters: { mode: 'runOnceForAllItems', jsCode: EDITORIAL_FILTER_JS },
  },
  output: [
    {
      category: 'ia',
      source_name: 'X',
      metadata: { post_id: '1', username: 'OpenAI' },
    },
  ],
});

const dedupeNode = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'dedupe',
    position: [1700, 180],
    parameters: { mode: 'runOnceForAllItems', jsCode: DEDUPE_JS },
  },
  output: [{ category: 'ia', metadata: { post_id: '1' } }],
});

const batchIngest = splitInBatches({
  version: 3,
  config: {
    name: 'Split in Batches',
    position: [1940, 180],
    parameters: { batchSize: 1 },
  },
});

const postIngest = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'POST Notitendencias ingest',
    position: [2180, 300],
    credentials: { httpHeaderAuth: newCredential('Notitendencias Bridge') },
    parameters: {
      method: 'POST',
      url: 'https://notitendencias.iareal.net/api/bridge/ingest',
      authentication: 'genericCredentialType',
      genericAuthType: 'httpHeaderAuth',
      sendHeaders: true,
      headerParameters: {
        parameters: [{ name: 'Content-Type', value: 'application/json' }],
      },
      sendBody: true,
      specifyBody: 'json',
      jsonBody: expr('{{ JSON.stringify($json) }}'),
    },
  },
  output: [{ ok: true, item: { id: 'raw-1', status: 'new' } }],
});

const logResumen = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Log resumen',
    position: [2180, 60],
    parameters: { mode: 'runOnceForAllItems', jsCode: LOG_SUMMARY_JS },
    executeOnce: true,
  },
  output: [{ provider: 'x', posts_received: 1, posts_sent_to_ingest: 1 }],
});

const postUsageRun = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'POST usage run',
    position: [2420, 60],
    credentials: { httpHeaderAuth: newCredential('Notitendencias Usage') },
    parameters: {
      method: 'POST',
      url: 'https://notitendencias.iareal.net/api/admin/usage/runs',
      authentication: 'genericCredentialType',
      genericAuthType: 'httpHeaderAuth',
      sendHeaders: true,
      headerParameters: {
        parameters: [{ name: 'Content-Type', value: 'application/json' }],
      },
      sendBody: true,
      specifyBody: 'json',
      jsonBody: expr('{{ JSON.stringify($json) }}'),
    },
  },
  output: [{ ok: true, run: { id: 'run-1' } }],
});

const radarNote = sticky(
  '## X AI Radar (catálogo 55)\n\n- Solo posts ORIGINALES de hoy (CDMX)\n- Excluye reply, RT, quote (-is:quote + metadata)\n- Máx. 1 original/cuenta (más reciente válido)\n- Crons: 10:45 y 15:45 CDMX',
  [setConfig, expandAccounts, xApiSearch],
  { position: [500, 400], width: 480, height: 220 },
);

export default workflow('nFBNa3Y1ueVHBLbc', 'Notitendencias - X AI Radar')
  .add(manualTrigger)
  .to(setConfig)
  .add(cron1045)
  .to(setConfig)
  .add(cron1545)
  .to(setConfig)
  .add(setConfig)
  .to(expandAccounts)
  .to(xApiSearch)
  .to(pickTodayPost)
  .to(normalizeXPosts)
  .to(editorialFilter)
  .to(dedupeNode)
  .to(
    batchIngest
      .onDone(logResumen.to(postUsageRun))
      .onEachBatch(postIngest.to(nextBatch(batchIngest))),
  )
  .add(radarNote);
