/**
 * Sincroniza nodos Code del workflow "Notitendencias - X AI Radar" en n8n vía API REST.
 * Requiere N8N_API_KEY.
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

async function main() {
  if (!KEY) {
    console.error("Falta N8N_API_KEY");
    process.exit(1);
  }

  const sdk = readFileSync(SDK_PATH, "utf8");

  const patches: Record<string, { jsCode: string; mode: string }> = {
    "Expand accounts": { jsCode: extractConst("EXPAND_ACCOUNTS_JS", sdk), mode: "runOnceForAllItems" },
    "Expand queries": { jsCode: extractConst("EXPAND_ACCOUNTS_JS", sdk), mode: "runOnceForAllItems" },
    pickTodayPost: { jsCode: extractConst("PICK_TODAY_JS", sdk), mode: "runOnceForEachItem" },
    normalizeXPosts: { jsCode: extractConst("NORMALIZE_JS", sdk), mode: "runOnceForAllItems" },
    editorialFilter: { jsCode: extractConst("EDITORIAL_FILTER_JS", sdk), mode: "runOnceForAllItems" },
    scoreAndFilter: { jsCode: extractConst("EDITORIAL_FILTER_JS", sdk), mode: "runOnceForAllItems" },
    dedupe: { jsCode: extractConst("DEDUPE_JS", sdk), mode: "runOnceForAllItems" },
    "Log resumen": { jsCode: extractConst("LOG_SUMMARY_JS", sdk), mode: "runOnceForAllItems" },
  };

  const wf = await api<Wf>(`/api/v1/workflows/${WORKFLOW_ID}`);

  let updated = 0;
  for (const node of wf.nodes) {
    const patch = patches[node.name];
    if (!patch) continue;
    node.parameters = { ...(node.parameters ?? {}), mode: patch.mode, jsCode: patch.jsCode };
    updated++;
  }

  const settings = {
    ...(wf.settings ?? {}),
    executionOrder: "v1",
    availableInMCP: true,
    timezone: "America/Mexico_City",
  };

  await api(`/api/v1/workflows/${WORKFLOW_ID}`, {
    method: "PUT",
    body: JSON.stringify({
      name: wf.name,
      nodes: wf.nodes,
      connections: wf.connections,
      settings,
    }),
  });

  console.log(`Workflow "${wf.name}" (${WORKFLOW_ID}): ${updated} nodos actualizados.`);
  console.log(`${BASE}/workflow/${WORKFLOW_ID}`);
  console.log("Nota: nodos nuevos (pickTodayPost, crons) requieren deploy vía MCP update_workflow si faltan en el canvas.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
