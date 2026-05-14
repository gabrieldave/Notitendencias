/**
 * Crea y activa en n8n los workflows de Notitendencias vía API REST.
 *
 * Requiere en .env o en el entorno:
 *   N8N_API_KEY   — API Key de n8n (Settings → API)
 *   N8N_BASE_URL  — opcional, por defecto https://n8n.vibesystems.tech
 *
 * Uso: npm run n8n:push
 */
import "dotenv/config";
import { randomUUID } from "node:crypto";

const BASE = (process.env.N8N_BASE_URL ?? "https://n8n.vibesystems.tech").replace(/\/$/, "");
const KEY = process.env.N8N_API_KEY?.trim();

function id() {
  return randomUUID();
}

type WfPayload = {
  name: string;
  nodes: Record<string, unknown>[];
  connections: Record<string, unknown>;
  settings: Record<string, unknown>;
};

function webhookWorkflow(name: string, path: string): WfPayload {
  const nWebhook = id();
  const nRespond = id();
  const webhookId = id();
  return {
    name,
    settings: {
      executionOrder: "v1",
      availableInMCP: true,
      callerPolicy: "workflowsFromSameOwner",
    },
    nodes: [
      {
        id: nWebhook,
        name: "Webhook",
        type: "n8n-nodes-base.webhook",
        typeVersion: 1,
        position: [0, 0],
        webhookId,
        parameters: {
          httpMethod: "POST",
          path,
          responseMode: "responseNode",
          options: {},
        },
      },
      {
        id: nRespond,
        name: "Respond OK",
        type: "n8n-nodes-base.respondToWebhook",
        typeVersion: 1,
        position: [300, 0],
        parameters: { options: {} },
      },
    ],
    connections: {
      Webhook: {
        main: [[{ node: "Respond OK", type: "main", index: 0 }]],
      },
    },
  };
}

function dailyDigestWorkflow(): WfPayload {
  const nSched = id();
  const nHttp = id();
  const nCode = id();
  return {
    name: "Notitendencias - Daily Digest",
    settings: {
      executionOrder: "v1",
      availableInMCP: true,
      callerPolicy: "workflowsFromSameOwner",
    },
    nodes: [
      {
        id: nSched,
        name: "Cron diario",
        type: "n8n-nodes-base.scheduleTrigger",
        typeVersion: 1.1,
        position: [0, 0],
        parameters: {
          rule: {
            interval: [{ triggerAtHour: 8 }],
          },
        },
      },
      {
        id: nHttp,
        name: "GET tendencias IA",
        type: "n8n-nodes-base.httpRequest",
        typeVersion: 4.1,
        position: [320, 0],
        parameters: {
          method: "GET",
          url: "https://notitendencias.vibesystems.tech/api/trends?category_slug=ia",
          options: {},
        },
      },
      {
        id: nCode,
        name: "Resumen placeholder",
        type: "n8n-nodes-base.code",
        typeVersion: 2,
        position: [640, 0],
        parameters: {
          jsCode: `let j = $json;
try {
  if (typeof j.body === 'string') j = JSON.parse(j.body);
  else if (j.body && typeof j.body === 'object') j = j.body;
} catch (e) {}
const trends = Array.isArray(j.trends) ? j.trends : [];
const lines = trends.slice(0, 10).map((t, i) => (i + 1) + ". " + (t.title || "(sin título)") + " — score " + (t.trendScore ?? "?"));
return [{
  json: {
    ok: true,
    generatedAt: new Date().toISOString(),
    count: trends.length,
    digestText: lines.join("\\n"),
    note: "Conecta aquí Email Gateway, Telegram o Slack para enviar el resumen."
  }
}];`,
        },
      },
    ],
    connections: {
      "Cron diario": {
        main: [[{ node: "GET tendencias IA", type: "main", index: 0 }]],
      },
      "GET tendencias IA": {
        main: [[{ node: "Resumen placeholder", type: "main", index: 0 }]],
      },
    },
  };
}

async function createWorkflow(body: WfPayload): Promise<{ id: string; name?: string }> {
  const res = await fetch(`${BASE}/api/v1/workflows`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-N8N-API-KEY": KEY!,
    },
    body: JSON.stringify({
      name: body.name,
      nodes: body.nodes,
      connections: body.connections,
      settings: body.settings,
      staticData: null,
    }),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`POST /workflows ${res.status}: ${text.slice(0, 800)}`);
  }
  return JSON.parse(text) as { id: string; name?: string };
}

async function activateWorkflow(workflowId: string): Promise<void> {
  let res = await fetch(`${BASE}/api/v1/workflows/${workflowId}/activate`, {
    method: "POST",
    headers: { "X-N8N-API-KEY": KEY! },
  });
  if (res.ok) return;
  const t1 = await res.text();
  res = await fetch(`${BASE}/api/v1/workflows/${workflowId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "X-N8N-API-KEY": KEY!,
    },
    body: JSON.stringify({ active: true }),
  });
  if (!res.ok) {
    const t2 = await res.text();
    throw new Error(`Activate failed: POST ${t1.slice(0, 200)} | PATCH ${t2.slice(0, 200)}`);
  }
}

function webhookUrl(path: string) {
  return `${BASE}/webhook/${path}`;
}

async function main() {
  if (!KEY) {
    console.error("Falta N8N_API_KEY. En n8n: Settings → API → Create API Key.");
    console.error("Luego: export N8N_API_KEY=... && npm run n8n:push");
    process.exit(1);
  }

  const definitions: WfPayload[] = [
    webhookWorkflow("Notitendencias - Published Trend Event", "notitendencias-published-trend"),
    webhookWorkflow("Notitendencias - High Score Alert", "notitendencias-alert"),
    webhookWorkflow("Notitendencias - Newsletter Subscribe", "notitendencias-newsletter"),
    dailyDigestWorkflow(),
  ];

  console.log("n8n:", BASE);
  const lines: string[] = [];

  for (const def of definitions) {
    const created = await createWorkflow(def);
    console.log("\n✓ Creado:", def.name, "→ id:", created.id);
    try {
      await activateWorkflow(created.id);
      console.log("  Activado.");
    } catch (e) {
      console.warn("  No se pudo activar automáticamente:", e);
      console.warn("  Actívalo manualmente en la UI de n8n.");
    }

    const wh = def.nodes.find((n) => n.type === "n8n-nodes-base.webhook") as
      | { parameters?: { path?: string } }
      | undefined;
    if (wh?.parameters?.path) {
      const u = webhookUrl(wh.parameters.path);
      console.log("  Webhook producción:", u);
      lines.push(`${def.name}\n  ${u}\n`);
    } else {
      console.log("  (sin webhook — flujo por cron)");
    }
  }

  console.log("\n--- Copiar a Coolify / .env Notitendencias ---\n");
  console.log(`N8N_WEBHOOK_PUBLISHED_TREND=${webhookUrl("notitendencias-published-trend")}`);
  console.log(`N8N_WEBHOOK_ALERTS=${webhookUrl("notitendencias-alert")}`);
  console.log(`N8N_WEBHOOK_NEWSLETTER=${webhookUrl("notitendencias-newsletter")}`);
  console.log("\nListo.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
