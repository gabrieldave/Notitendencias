import { AdminNav } from "@/components/AdminNav";
import { AdminUsageSettingsForm } from "@/components/AdminUsageSettingsForm";
import { getUsageSummary } from "@/lib/usage";

export const dynamic = "force-dynamic";

function usd(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

function pct(n: number) {
  return `${n.toFixed(1)}%`;
}

const alertStyles = {
  green: "border-emerald-200 bg-emerald-50 text-emerald-900",
  yellow: "border-amber-200 bg-amber-50 text-amber-950",
  red: "border-red-200 bg-red-50 text-red-900",
} as const;

export default async function AdminUsagePage() {
  const summary = await getUsageSummary("x");

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-brand-navy">Consumo X API</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Estimación interna basada en tarifas configuradas. Verifica el balance real en X.
          </p>
        </div>
        <AdminNav active="/admin/usage" />
      </div>

      <div
        className={`mb-6 rounded-2xl border px-4 py-3 text-sm font-medium ${alertStyles[summary.alertLevel]}`}
      >
        {summary.recommendation} — Presupuesto usado: {pct(summary.percentBudgetUsed)}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: "Gasto hoy (est.)", value: usd(summary.spendTodayUsd) },
          { label: "Gasto mes (est.)", value: usd(summary.spendMonthUsd) },
          { label: "Presupuesto mensual", value: usd(summary.settings.monthlyBudgetUsd) },
          { label: "Saldo prepago", value: usd(summary.settings.prepaidBalanceUsd) },
          { label: "% presupuesto", value: pct(summary.percentBudgetUsed) },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {card.label}
            </p>
            <p className="mt-2 text-xl font-black text-brand-navy">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-bold text-brand-navy">Métricas hoy</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            <li>Posts recibidos: {summary.today.postsReceived}</li>
            <li>Enviados a Notitendencias: {summary.today.postsSent}</li>
            <li>Descartados (filtrados): {summary.today.postsFiltered}</li>
            <li>Duplicados omitidos: {summary.today.duplicatesSkipped}</li>
            <li>Costo prom. por hallazgo: {usd(summary.avgCostPerIngest)}</li>
          </ul>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-bold text-brand-navy">Proyección mensual</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            <li>Gasto últimos 7 días: {usd(summary.spendLast7DaysUsd)}</li>
            <li>Proyectado (prom. 7d × 30): {usd(summary.projectedMonthlyUsd)}</li>
            <li>Diferencia vs presupuesto: {usd(summary.budgetDeltaUsd)}</li>
            <li>Posts recibidos (mes): {summary.month.postsReceived}</li>
            <li>Enviados a ingest (mes): {summary.month.postsSent}</li>
            <li>Costo prom. por post recibido: {usd(summary.avgCostPerPostReceived)}</li>
          </ul>
        </section>
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-bold text-brand-navy">Últimas corridas</h2>
        <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Inicio</th>
                <th className="px-3 py-2">Workflow</th>
                <th className="px-3 py-2">Tipo</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Req.</th>
                <th className="px-3 py-2">Rec.</th>
                <th className="px-3 py-2">Filt.</th>
                <th className="px-3 py-2">Sent</th>
                <th className="px-3 py-2">Dup.</th>
                <th className="px-3 py-2">Costo est.</th>
                <th className="px-3 py-2">Err.</th>
              </tr>
            </thead>
            <tbody>
              {summary.recentRuns.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-3 py-6 text-slate-500">
                    Sin corridas registradas. Configura USAGE_API_KEY en n8n.
                  </td>
                </tr>
              ) : (
                summary.recentRuns.map((r) => (
                  <tr key={r.id} className="border-t border-slate-100">
                    <td className="whitespace-nowrap px-3 py-2 text-xs">
                      {r.startedAt
                        ? new Date(r.startedAt).toLocaleString("es-MX", {
                            timeZone: "America/Mexico_City",
                          })
                        : "—"}
                    </td>
                    <td className="max-w-[140px] truncate px-3 py-2">{r.workflowName ?? "—"}</td>
                    <td className="px-3 py-2">{r.runType ?? "—"}</td>
                    <td className="px-3 py-2">{r.status ?? "—"}</td>
                    <td className="px-3 py-2">{r.postsRequested ?? 0}</td>
                    <td className="px-3 py-2">{r.postsReceived ?? 0}</td>
                    <td className="px-3 py-2">{r.postsFiltered ?? 0}</td>
                    <td className="px-3 py-2">{r.postsSentToIngest ?? 0}</td>
                    <td className="px-3 py-2">{r.duplicatesSkipped ?? 0}</td>
                    <td className="px-3 py-2 font-medium">{usd(r.estimatedCostUsd)}</td>
                    <td className="px-3 py-2">{r.errorsCount ?? 0}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <AdminUsageSettingsForm initial={summary.settings} />
    </div>
  );
}
