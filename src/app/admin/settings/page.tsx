import { AdminNav } from "@/components/AdminNav";
import {
  fingerprint,
  maskSecretConfigured,
} from "@/lib/admin-auth";
export const dynamic = "force-dynamic";

export default function AdminSettingsPage() {
  const deepseek = maskSecretConfigured(process.env.DEEPSEEK_API_KEY);
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
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-black text-brand-navy">Ajustes</h1>
        <AdminNav active="/admin/settings" />
      </div>
      <div className="mt-8 space-y-6 text-sm text-slate-700">
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-bold text-brand-navy">DeepSeek API</h2>
          <p className="mt-2">
            Estado: {deepseek ? "configurada" : "no configurada"} (huella{" "}
            {fingerprint(process.env.DEEPSEEK_API_KEY)})
          </p>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-bold text-brand-navy">Radar X (n8n)</h2>
          <p className="mt-2 text-slate-600">
            La ingesta de señales desde X se orquesta en n8n con el workflow{" "}
            <strong>Notitendencias - X AI Radar</strong>. Variables en n8n (no en esta app):{" "}
            <code className="rounded bg-slate-100 px-1 text-xs">X_BEARER_TOKEN</code>,{" "}
            <code className="rounded bg-slate-100 px-1 text-xs">BRIDGE_API_KEY</code>,{" "}
            <code className="rounded bg-slate-100 px-1 text-xs">NOTITENDENCIAS_INGEST_URL</code>, credencial{" "}
            <strong>Notitendencias Usage</strong> con <code className="rounded bg-slate-100 px-1 text-xs">USAGE_API_KEY</code>{" "}
            (misma que en Coolify).
            Ver{" "}
            <code className="rounded bg-slate-100 px-1 text-xs">docs/n8n-x-ai-radar-workflow.md</code> en el
            repositorio.
          </p>
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
