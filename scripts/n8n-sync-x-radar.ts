/**
 * Sincroniza nodos Code del workflow "Notitendencias - X AI Radar" en n8n vía API REST.
 * No crea workflows de notificaciones (archivados). Requiere N8N_API_KEY.
 *
 * Uso: npm run n8n:sync-x-radar
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const BASE = (process.env.N8N_BASE_URL ?? "https://n8n.vibesystems.tech").replace(/\/$/, "");
const KEY = process.env.N8N_API_KEY?.trim();
const WORKFLOW_ID = process.env.N8N_X_RADAR_WORKFLOW_ID ?? "nFBNa3Y1ueVHBLbc";

const SDK_PATH = join(process.cwd(), "scripts/n8n-x-ai-radar-workflow.sdk.ts");

function extractConst(name: string, source: string): string {
  const re = new RegExp(`const ${name} = \`([\\s\\S]*?)\`;`);
  const m = source.match(re);
  if (!m) throw new Error(`No se encontró const ${name} en ${SDK_PATH}`);
  return m[1];
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "X-N8N-API-KEY": KEY!,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${init?.method ?? "GET"} ${path} ${res.status}: ${text.slice(0, 600)}`);
  return JSON.parse(text) as T;
}

type Wf = {
  id: string;
  name: string;
  nodes: Array<{
    id: string;
    name: string;
    type: string;
    parameters?: Record<string, unknown>;
    disabled?: boolean;
  }>;
  connections: Record<string, unknown>;
  settings?: Record<string, unknown>;
};

const CODE_NODES: Record<string, string> = {};

async function main() {
  if (!KEY) {
    console.error("Falta N8N_API_KEY");
    process.exit(1);
  }

  const sdk = readFileSync(SDK_PATH, "utf8");
  const patches: Record<string, string> = {
    normalizeXPosts: extractConst("NORMALIZE_JS", sdk),
    scoreAndFilter: extractConst("SCORE_FILTER_JS", sdk),
    dedupe: extractConst("DEDUPE_JS", sdk),
    "Expand queries": extractConst("EXPAND_QUERIES_JS", sdk),
    "Log resumen": extractConst("LOG_SUMMARY_JS", sdk),
  };

  const wf = await api<Wf>(`/api/v1/workflows/${WORKFLOW_ID}`);

  let updated = 0;
  for (const node of wf.nodes) {
    const js = patches[node.name];
    if (!js) continue;
    node.parameters = {
      ...(node.parameters ?? {}),
      mode: "runOnceForAllItems",
      jsCode: js,
    };
    updated++;
  }

  await api(`/api/v1/workflows/${WORKFLOW_ID}`, {
    method: "PUT",
    body: JSON.stringify({
      name: wf.name,
      nodes: wf.nodes,
      connections: wf.connections,
      settings: wf.settings ?? { executionOrder: "v1", availableInMCP: true },
    }),
  });

  console.log(`Workflow "${wf.name}" (${WORKFLOW_ID}): ${updated} nodos Code actualizados.`);
  console.log(`${BASE}/workflow/${WORKFLOW_ID}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
