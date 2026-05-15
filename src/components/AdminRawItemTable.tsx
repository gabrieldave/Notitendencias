"use client";

import type { RawTrendItem } from "@/db/schema";
import { EDITORIAL_ARXIV_ALERT_ES, rawItemMentionsArxiv } from "@/lib/editorial";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminRawItemTable({ items }: { items: RawTrendItem[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [batchBusy, setBatchBusy] = useState(false);

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

  async function processAll() {
    if (
      !confirm(
        `¿Procesar ${items.length} hallazgos de esta lista? Puede tardar varios minutos y consume la API de DeepSeek.`,
      )
    ) {
      return;
    }
    setBatchBusy(true);
    try {
      const res = await fetch("/api/admin/process-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: items.map((it) => it.id) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error");
      const summary = data.summary as { succeeded: number; failed: number; total: number };
      router.refresh();
      alert(
        `Procesamiento masivo terminado: ${summary.succeeded}/${summary.total} correctos${
          summary.failed ? `, ${summary.failed} fallidos` : ""
        }.`,
      );
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error");
    } finally {
      setBatchBusy(false);
    }
  }

  if (items.length === 0) {
    return <p className="mt-4 text-sm text-slate-600">No hay hallazgos pendientes.</p>;
  }

  return (
    <>
      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={() => void processAll()}
          disabled={busy !== null || batchBusy}
          className="rounded-full bg-brand-orange px-4 py-2 text-xs font-bold text-white shadow-sm disabled:opacity-50"
        >
          {batchBusy ? "Procesando…" : `Procesar todo (${items.length})`}
        </button>
      </div>
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
                  <div className="flex flex-wrap items-center gap-2">
                    <span>{it.title}</span>
                    {it.metadataJson &&
                      typeof it.metadataJson === "object" &&
                      !Array.isArray(it.metadataJson) &&
                      it.metadataJson.platform === "x" && (
                        <span className="rounded bg-slate-900 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                          X
                        </span>
                      )}
                  </div>
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
                    disabled={busy === it.id || batchBusy}
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
    </>
  );
}
