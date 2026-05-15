/**
 * Sincroniza nodos Code del workflow "Notitendencias - X AI Radar" en n8n vía API REST.
 * Requiere N8N_API_KEY.
 *
 * Uso: npm run n8n:sync-x-radar
 */
import "dotenv/config";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const BASE = (process.env.N8N_BASE_URL ?? "https://n8n.vibesystems.tech").replace(/\/$/, "");
const KEY = process.env.N8N_API_KEY?.trim();
const WORKFLOW_ID = process.env.N8N_X_RADAR_WORKFLOW_ID ?? "nFBNa3Y1ueVHBLbc";

const SDK_PATH = join(process.cwd(), "scripts/n8n-x-ai-radar-workflow.sdk.ts");

function extractConst(name: string, source: string): string {
  const tpl = new RegExp(`const ${name} = \`\\$\\{N8N_TZ_HELPER\\}([\\s\\S]*?)\`;`);
  const plain = new RegExp(`const ${name} = \`([\\s\\S]*?)\`;`);
  const helperMatch = source.match(/const N8N_TZ_HELPER = `([\s\S]*?)`;/);
  const helper = helperMatch?.[1] ?? "";
  const m = source.match(tpl) ?? source.match(plain);
  if (!m) throw new Error(`No se encontró const ${name} en ${SDK_PATH}`);
  const body = m[1];
  return body.startsWith("function n8nStartOfTodayInZone") ? body : helper + body;
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

type WfNode = {
  id: string;
  name: string;
  type: string;
  typeVersion?: number;
  position: [number, number];
  parameters?: Record<string, unknown>;
  disabled?: boolean;
  credentials?: Record<string, { id: string; name: string }>;
  executeOnce?: boolean;
};

type Wf = {
  id: string;
  name: string;
  nodes: WfNode[];
  connections: Record<string, unknown>;
  settings?: Record<string, unknown>;
};

function usageHttpNode(existing?: WfNode): WfNode {
  return {
    id: existing?.id ?? randomUUID(),
    name: "POST usage run",
    type: "n8n-nodes-base.httpRequest",
    typeVersion: 4.4,
    position: existing?.position ?? [2240, 96],
    credentials: existing?.credentials,
    parameters: {
      method: "POST",
      url: "https://notitendencias.iareal.net/api/admin/usage/runs",
      authentication: "genericCredentialType",
      genericAuthType: "httpHeaderAuth",
      sendHeaders: true,
      headerParameters: {
        parameters: [{ name: "Content-Type", value: "application/json" }],
      },
      sendBody: true,
      specifyBody: "json",
      jsonBody: "={{ JSON.stringify($json) }}",
    },
  };
}

function wireUsageConnections(connections: Record<string, unknown>): void {
  const split = connections["Split in Batches"] as { main?: Array<Array<{ node: string; type: string; index: number }>> };
  if (!split?.main) return;

  split.main[0] = [{ node: "Log resumen", type: "main", index: 0 }];
  connections["Log resumen"] = {
    main: [[{ node: "POST usage run", type: "main", index: 0 }]],
  };
}

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
    if (node.name === "Log resumen") node.executeOnce = true;
    updated++;
  }

  let usageIdx = wf.nodes.findIndex((n) => n.name === "POST usage run");
  if (usageIdx === -1) {
    const bridgeNode = wf.nodes.find((n) => n.name === "POST Notitendencias ingest");
    wf.nodes.push(usageHttpNode(bridgeNode));
    usageIdx = wf.nodes.length - 1;
    console.log("Nodo POST usage run añadido.");
  } else {
    wf.nodes[usageIdx] = usageHttpNode(wf.nodes[usageIdx]);
    console.log("Nodo POST usage run actualizado.");
  }

  wireUsageConnections(wf.connections);
  updated++;

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

  console.log(`Workflow "${wf.name}" (${WORKFLOW_ID}): ${updated} cambios aplicados.`);
  console.log(`${BASE}/workflow/${WORKFLOW_ID}`);
  console.log(
    "Credencial n8n «Notitendencias Usage»: Header Auth Bearer = USAGE_API_KEY (misma que Coolify).",
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
