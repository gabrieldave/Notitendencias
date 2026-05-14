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
