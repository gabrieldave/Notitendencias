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

const CONFIG_JSON = JSON.stringify({
  keyAccounts: [
    'OpenAI',
    'AnthropicAI',
    'GoogleDeepMind',
    'GoogleAI',
    'MetaAI',
    'Microsoft',
    'NVIDIAAI',
    'huggingface',
    'Perplexity_AI',
    'MistralAI',
    'deepseek_ai',
    'ycombinator',
    'ProductHunt',
  ],
  queries: [
    '"AI agent" lang:en',
    '"OpenAI" lang:en',
    '"Claude" lang:en',
    '"Gemini AI" lang:en',
    '"DeepSeek" lang:en',
    '"new AI tool" lang:en',
    '"AI startup" lang:en',
    '"vibe coding" lang:en',
    '"inteligencia artificial" lang:es',
    '"herramienta de IA" lang:es',
    '"agentes de IA" lang:es',
    '"automatización con IA" lang:es',
  ],
  maxPostsPerRun: 50,
});

const EXPAND_QUERIES_JS = `const config = $input.first().json;
const maxRun = Number(config.maxPostsPerRun || 50);
const maxResults = Math.min(10, maxRun);
const queries = (config.queries || []).slice(0, 12);
return queries.map((query) => ({
  json: {
    ...config,
    query,
    detected_query: query,
    max_results: maxResults,
  },
}));`;

const NORMALIZE_JS = `const config = $('Set config').first().json;
const keyAccounts = new Set((config.keyAccounts || []).map((h) => h.toLowerCase()));
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
  if (t.length <= 100) return t.length ? t : 'Señal de IA en @' + username;
  return 'Conversación de IA en @' + username + ': ' + t.slice(0, 80) + '…';
}

for (const item of items) {
  const tweets = item.json.data || [];
  const users = {};
  for (const u of item.json.includes?.users || []) {
    users[u.id] = u;
  }
  const detectedQuery =
    item.json.detected_query ||
    item.json.query ||
    ($('Expand queries').item?.json?.query ?? '');

  for (const tw of tweets) {
    const user = users[tw.author_id] || {};
    const username = user.username || 'unknown';
    const postId = tw.id;
    const text = tw.text || '';
    const externalUrl = firstUrl(tw.entities);

    out.push({
      json: {
        category: 'ia',
        source_name: 'X',
        source_url: 'https://x.com/' + username + '/status/' + postId,
        title: editorialTitle(text, username),
        raw_text: text.slice(0, 1500),
        detected_at: tw.created_at || new Date().toISOString(),
        metadata: {
          platform: 'x',
          signal_type: 'ai_trend',
          author: user.name || '',
          username,
          post_id: postId,
          likes: tw.public_metrics?.like_count ?? 0,
          reposts: tw.public_metrics?.retweet_count ?? 0,
          replies: tw.public_metrics?.reply_count ?? 0,
          quotes: tw.public_metrics?.quote_count ?? 0,
          detected_query: detectedQuery,
          relevance_reason: keyAccounts.has(username.toLowerCase())
            ? 'Cuenta clave de IA'
            : 'Coincide con query de radar',
          external_url: externalUrl,
          from_key_account: keyAccounts.has(username.toLowerCase()),
        },
      },
    });
  }
}

return out;`;

const SCORE_FILTER_JS = `const KEYWORDS = /\\b(launch|released|agent|model|AI tool|automation|OpenAI|Claude|Gemini|DeepSeek)\\b/i;
const SPANISH = /\\b(inteligencia artificial|herramienta|agentes|automatización|méxico|latam)\\b/i;
const ARXIV = /arxiv\\.org/i;

const items = $input.all();
const kept = [];

for (const item of items) {
  const j = item.json;
  const meta = j.metadata || {};
  const text = (j.title || '') + ' ' + (j.raw_text || '') + ' ' + (meta.external_url || '');
  let score = 0;

  if (meta.from_key_account) score += 30;
  if (KEYWORDS.test(text)) score += 20;
  if (meta.external_url) score += 15;
  const engagement = (meta.likes || 0) + (meta.reposts || 0) * 2;
  if (engagement >= 50) score += 10;
  if (SPANISH.test(text)) score += 10;

  if (ARXIV.test(text)) continue;
  if (score < 40) continue;

  meta.relevance_reason = (meta.relevance_reason || '') + ' score=' + score;
  j.metadata = meta;
  kept.push({ json: j });
}

return kept;`;

const DEDUPE_JS = `const seenIds = new Set();
const seenUrls = new Set();
const out = [];

for (const item of $input.all()) {
  const meta = item.json.metadata || {};
  const postId = meta.post_id;
  const sourceUrl = item.json.source_url;
  if (postId && seenIds.has(postId)) continue;
  if (sourceUrl && seenUrls.has(sourceUrl)) continue;
  if (postId) seenIds.add(postId);
  if (sourceUrl) seenUrls.add(sourceUrl);
  out.push(item);
}

return out;`;

const LOG_SUMMARY_JS = `const items = $('dedupe').all();
return [{
  json: {
    finishedAt: new Date().toISOString(),
    normalizedCandidates: items.length,
    note: 'Radar X con credentials Header Auth (X API Bearer + Notitendencias Bridge).',
    workflow: 'Notitendencias - X AI Radar',
  },
}];`;

const manualTrigger = trigger({
  type: 'n8n-nodes-base.manualTrigger',
  version: 1,
  config: { name: 'Manual Trigger (tests)', position: [0, 200] },
  output: [{}],
});

const cronTrigger = trigger({
  type: 'n8n-nodes-base.scheduleTrigger',
  version: 1.3,
  config: {
    name: 'Cron diario 8am',
    position: [0, 0],
    parameters: {
      rule: { interval: [{ field: 'days', triggerAtHour: 8 }] },
    },
  },
  output: [{}],
});

const setConfig = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'Set config',
    position: [240, 100],
    parameters: { mode: 'raw', jsonOutput: CONFIG_JSON },
  },
  output: [
    {
      keyAccounts: ['OpenAI'],
      queries: ['"AI agent" lang:en'],
      maxPostsPerRun: 50,
    },
  ],
});

const expandQueries = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Expand queries',
    position: [480, 100],
    parameters: { mode: 'runOnceForAllItems', jsCode: EXPAND_QUERIES_JS },
  },
  output: [{ query: '"AI agent" lang:en', max_results: 10 }],
});

const xApiSearch = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'X API Recent Search',
    position: [720, 100],
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
          { name: 'max_results', value: expr('{{ $json.max_results }}') },
          {
            name: 'tweet.fields',
            value: 'public_metrics,created_at,author_id,entities',
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
          created_at: '2026-05-15T08:00:00.000Z',
        },
      ],
      includes: { users: [{ id: 'u1', username: 'OpenAI', name: 'OpenAI' }] },
      detected_query: '"AI agent" lang:en',
    },
  ],
});

const normalizeXPosts = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'normalizeXPosts',
    position: [960, 100],
    parameters: { mode: 'runOnceForAllItems', jsCode: NORMALIZE_JS },
  },
  output: [
    {
      category: 'ia',
      source_name: 'X',
      source_url: 'https://x.com/OpenAI/status/1',
      title: 'New AI tool launch',
      metadata: { platform: 'x', post_id: '1', username: 'OpenAI' },
    },
  ],
});

const scoreAndFilter = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'scoreAndFilter',
    position: [1200, 100],
    parameters: { mode: 'runOnceForAllItems', jsCode: SCORE_FILTER_JS },
  },
  output: [
    {
      category: 'ia',
      source_name: 'X',
      metadata: { post_id: '1', from_key_account: true },
    },
  ],
});

const dedupeNode = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'dedupe',
    position: [1440, 100],
    parameters: { mode: 'runOnceForAllItems', jsCode: DEDUPE_JS },
  },
  output: [{ category: 'ia', metadata: { post_id: '1' } }],
});

const batchIngest = splitInBatches({
  version: 3,
  config: {
    name: 'Split in Batches',
    position: [1680, 100],
    parameters: { batchSize: 1 },
  },
});

const postIngest = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'POST Notitendencias ingest',
    position: [1920, 200],
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
    position: [2160, 0],
    parameters: { mode: 'runOnceForAllItems', jsCode: LOG_SUMMARY_JS },
    executeOnce: true,
  },
  output: [{ finishedAt: '2026-05-15T08:00:00.000Z', normalizedCandidates: 1 }],
});

const betaNote = sticky(
  '## X AI Radar\n\n1. Credentials: X API Bearer + Notitendencias Bridge (Header Auth)\n2. Prueba con Manual Trigger; max_results=10\n3. Activa el workflow solo cuando la prueba manual funcione',
  [setConfig, xApiSearch, postIngest],
  { position: [240, -200], width: 420, height: 200 },
);

export default workflow('nFBNa3Y1ueVHBLbc', 'Notitendencias - X AI Radar')
  .add(manualTrigger)
  .to(setConfig)
  .add(cronTrigger)
  .to(setConfig)
  .add(setConfig)
  .to(expandQueries)
  .to(xApiSearch)
  .to(normalizeXPosts)
  .to(scoreAndFilter)
  .to(dedupeNode)
  .to(
    batchIngest
      .onDone(logResumen)
      .onEachBatch(postIngest.to(nextBatch(batchIngest))),
  )
  .add(betaNote);
