"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Settings = {
  monthlyBudgetUsd: number;
  prepaidBalanceUsd: number;
  postReadCostUsd: number;
  trendReadCostUsd: number;
  userReadCostUsd: number;
};

export function AdminUsageSettingsForm({ initial }: { initial: Settings }) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/usage/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "x",
          monthly_budget_usd: form.monthlyBudgetUsd,
          prepaid_balance_usd: form.prepaidBalanceUsd,
          post_read_cost_usd: form.postReadCostUsd,
          trend_read_cost_usd: form.trendReadCostUsd,
          user_read_cost_usd: form.userReadCostUsd,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al guardar");
      setMsg("Configuración guardada.");
      router.refresh();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="mt-6 space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
      <h2 className="text-lg font-bold text-brand-navy">Tarifas y presupuesto (estimación)</h2>
      <p className="text-xs text-slate-500">
        Gasto estimado interno. Verifica el balance real en el portal de X.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="font-semibold text-slate-700">Presupuesto mensual (USD)</span>
          <input
            type="number"
            step="0.01"
            min="0"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            value={form.monthlyBudgetUsd}
            onChange={(e) => setForm({ ...form, monthlyBudgetUsd: Number(e.target.value) })}
          />
        </label>
        <label className="block text-sm">
          <span className="font-semibold text-slate-700">Saldo prepago (USD)</span>
          <input
            type="number"
            step="0.01"
            min="0"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            value={form.prepaidBalanceUsd}
            onChange={(e) => setForm({ ...form, prepaidBalanceUsd: Number(e.target.value) })}
          />
        </label>
        <label className="block text-sm">
          <span className="font-semibold text-slate-700">Costo por post leído (USD)</span>
          <input
            type="number"
            step="0.000001"
            min="0"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            value={form.postReadCostUsd}
            onChange={(e) => setForm({ ...form, postReadCostUsd: Number(e.target.value) })}
          />
        </label>
        <label className="block text-sm">
          <span className="font-semibold text-slate-700">Costo por trend leído (USD)</span>
          <input
            type="number"
            step="0.000001"
            min="0"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            value={form.trendReadCostUsd}
            onChange={(e) => setForm({ ...form, trendReadCostUsd: Number(e.target.value) })}
          />
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="font-semibold text-slate-700">Costo por user read (USD)</span>
          <input
            type="number"
            step="0.000001"
            min="0"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            value={form.userReadCostUsd}
            onChange={(e) => setForm({ ...form, userReadCostUsd: Number(e.target.value) })}
          />
        </label>
      </div>
      <button
        type="submit"
        disabled={busy}
        className="rounded-full bg-brand-orange px-5 py-2 text-sm font-bold text-white disabled:opacity-50"
      >
        {busy ? "Guardando…" : "Guardar configuración"}
      </button>
      {msg && <p className="text-sm text-slate-600">{msg}</p>}
    </form>
  );
}
