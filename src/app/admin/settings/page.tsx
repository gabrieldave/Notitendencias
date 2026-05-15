import Link from "next/link";
import {
  fingerprint,
  maskSecretConfigured,
} from "@/lib/admin-auth";
import { getWebhookUrl } from "@/lib/webhook";

export const dynamic = "force-dynamic";

export default function AdminSettingsPage() {
  const deepseek = maskSecretConfigured(process.env.DEEPSEEK_API_KEY);
  const pub = getWebhookUrl("N8N_WEBHOOK_PUBLISHED_TREND");
  const news = getWebhookUrl("N8N_WEBHOOK_NEWSLETTER");
  const alerts = getWebhookUrl("N8N_WEBHOOK_ALERTS");
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3015";
  const port = process.env.PORT ?? "3015";

  const curl = `curl -X POST "${base}/api/bridge/ingest" \\
  -H "Authorization: Bearer TU_BRIDGE_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "category": "ia",
    "source_name": "Kimi WebBridge",
    "source_url": "https://example.com",
    "title": "Nueva herramienta de IA empieza a ser tendencia",
    "raw_text": "Kimi detectó una conversación creciente sobre una herramienta de IA para automatizar navegación web.",
    "detected_at": "2026-05-14T18:00:00Z",
    "metadata": {
      "platform": "web",
      "signal_type": "trend",
      "relevance_reason": "Varias fuentes están hablando del tema"
    }
  }'`;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/admin" className="text-sm font-semibold text-brand-orange hover:underline">
        ← Volver al panel
      </Link>
      <h1 className="mt-4 text-3xl font-black text-brand-navy">Ajustes</h1>
      <div className="mt-8 space-y-6 text-sm text-slate-700">
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-bold text-brand-navy">DeepSeek API</h2>
          <p className="mt-2">
            Estado: {deepseek ? "configurada" : "no configurada"} (huella{" "}
            {fingerprint(process.env.DEEPSEEK_API_KEY)})
          </p>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-bold text-brand-navy">Webhooks n8n</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Publicación: {pub ? "configurado" : "vacío"}</li>
            <li>Newsletter: {news ? "configurado" : "vacío"}</li>
            <li>Alertas: {alerts ? "configurado" : "vacío"}</li>
          </ul>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-bold text-brand-navy">Kimi WebBridge</h2>
          <p className="mt-2">
            Endpoint de ingestión:{" "}
            <code className="rounded bg-slate-100 px-1 text-xs">POST {base}/api/bridge/ingest</code>
          </p>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-bold text-brand-navy">Retención de datos</h2>
          <p className="mt-2 text-slate-600">
            Política aplicada por el script <code className="rounded bg-slate-100 px-1 text-xs">npm run cleanup:retention</code>{" "}
            (ver <code className="rounded bg-slate-100 px-1 text-xs">docs/data-retention.md</code>). Por defecto corre en
            modo simulación (<code className="rounded bg-slate-100 px-1 text-xs">DRY_RUN=true</code>); la limpieza real usa{" "}
            <code className="rounded bg-slate-100 px-1 text-xs">DRY_RUN=false</code>.
          </p>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-slate-700">
            <li>
              <strong>raw_trend_items</strong> procesados: eliminar tras <strong>30 días</strong> (tras desvincular tendencias).
            </li>
            <li>
              <strong>raw_trend_items</strong> rechazados / duplicados / error: eliminar tras <strong>15 días</strong>.
            </li>
            <li>
              <strong>raw_trend_items</strong> nuevos o en revisión editorial: sin borrado automático hasta{" "}
              <strong>30 días</strong>; luego se marcan rechazados y entran en la política anterior.
            </li>
            <li>
              <strong>Tendencias publicadas</strong>: archivar (no borrar) tras <strong>45 días</strong> desde la publicación.
            </li>
            <li>
              <strong>Tendencias archivadas</strong>: eliminar tras <strong>180 días</strong> en archivo (según{" "}
              <code className="text-xs">updated_at</code>).
            </li>
            <li>
              <strong>Tendencias draft o pending</strong> antiguas: archivar tras <strong>30 días</strong>.
            </li>
            <li>
              <strong>Tendencias rejected</strong>: eliminar tras <strong>30 días</strong>.
            </li>
            <li>
              <strong>app_events</strong>: eliminar tras <strong>30 días</strong>.
            </li>
            <li>
              <strong>newsletter_sends</strong>: mantener <strong>90 días</strong> de historial.
            </li>
            <li>
              <strong>Suscriptores</strong>: nunca se borran automáticamente.
            </li>
          </ul>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-bold text-brand-navy">Puerto</h2>
          <p className="mt-2">
            Producción esperada: <strong>{port}</strong> (Coolify / Docker).
          </p>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-bold text-brand-navy">Ejemplo curl</h2>
          <pre className="mt-3 overflow-x-auto rounded-xl bg-slate-900 p-4 text-xs text-slate-100">
            {curl}
          </pre>
        </section>
      </div>
    </div>
  );
}
