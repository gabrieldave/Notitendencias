"use client";

import type { RawTrendItem } from "@/db/schema";
import { EDITORIAL_ARXIV_ALERT_ES, rawItemMentionsArxiv } from "@/lib/editorial";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminRawItemTable({ items }: { items: RawTrendItem[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function processOne(id: string) {
    setBusy(id);
    try {
      const res = await fetch(`/api/process/${id}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error");
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(null);
    }
  }

  if (items.length === 0) {
    return <p className="mt-4 text-sm text-slate-600">No hay hallazgos pendientes.</p>;
  }

  return (
    <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">Título</th>
            <th className="px-4 py-3">Categoría</th>
            <th className="px-4 py-3">Fuente</th>
            <th className="px-4 py-3">Estado</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr key={it.id} className="border-t border-slate-100">
              <td className="px-4 py-3 font-medium text-brand-navy">
                <div>{it.title}</div>
                {rawItemMentionsArxiv(it) && (
                  <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5 text-xs font-semibold text-amber-950">
                    {EDITORIAL_ARXIV_ALERT_ES}
                  </p>
                )}
              </td>
              <td className="px-4 py-3">{it.categorySlug}</td>
              <td className="px-4 py-3">{it.sourceName}</td>
              <td className="px-4 py-3 text-xs font-semibold uppercase text-slate-600">
                {it.status}
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  type="button"
                  onClick={() => processOne(it.id)}
                  disabled={busy === it.id}
                  className="rounded-full bg-brand-orange px-3 py-1 text-xs font-bold text-white disabled:opacity-50"
                >
                  {busy === it.id ? "…" : "Procesar"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
