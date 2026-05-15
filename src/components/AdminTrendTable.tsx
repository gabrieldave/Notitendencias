"use client";

import type { Trend } from "@/db/schema";
import { EDITORIAL_ARXIV_ALERT_ES, trendMentionsArxiv } from "@/lib/editorial";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminTrendTable({ trends }: { trends: Trend[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [batchBusy, setBatchBusy] = useState(false);

  async function publish(t: Trend) {
    setBusy(`pub-${t.id}`);
    try {
      const needsConfirm = trendMentionsArxiv(t);
      if (needsConfirm) {
        const ok = confirm(
          `${EDITORIAL_ARXIV_ALERT_ES}\n\n¿Confirmas publicación manual explícita pese a la política editorial?`,
        );
        if (!ok) {
          setBusy(null);
          return;
        }
      }
      const res = await fetch(`/api/trends/${t.id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(needsConfirm ? { confirmEditorialArxiv: true } : {}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? data.error ?? "Error");
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(null);
    }
  }

  async function publishAll() {
    const needsConfirm = trends.some((t) => trendMentionsArxiv(t));
    if (needsConfirm) {
      const ok = confirm(
        `${EDITORIAL_ARXIV_ALERT_ES}\n\nHay tendencias con mención a arXiv en esta lista. ¿Confirmas publicar todas tras revisión manual explícita?`,
      );
      if (!ok) return;
    } else if (!confirm(`¿Publicar ${trends.length} tendencias de esta lista?`)) {
      return;
    }

    setBatchBusy(true);
    try {
      const res = await fetch("/api/admin/publish-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: trends.map((t) => t.id),
          ...(needsConfirm ? { confirmEditorialArxiv: true } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message ?? data.error ?? "Error");
      }
      const summary = data.summary as { succeeded: number; failed: number; total: number };
      router.refresh();
      alert(
        `Publicación masiva terminada: ${summary.succeeded}/${summary.total} correctas${
          summary.failed ? `, ${summary.failed} fallidas` : ""
        }.`,
      );
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error");
    } finally {
      setBatchBusy(false);
    }
  }

  async function reject(id: string) {
    if (!confirm("¿Rechazar esta tendencia?")) return;
    setBusy(`rej-${id}`);
    try {
      const res = await fetch(`/api/trends/${id}/reject`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error");
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(null);
    }
  }

  if (trends.length === 0) {
    return <p className="mt-4 text-sm text-slate-600">No hay tendencias en draft/pending.</p>;
  }

  return (
    <>
      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={() => void publishAll()}
          disabled={busy !== null || batchBusy}
          className="rounded-full bg-brand-navy px-4 py-2 text-xs font-bold text-white shadow-sm disabled:opacity-50"
        >
          {batchBusy ? "Publicando…" : `Publicar todo (${trends.length})`}
        </button>
      </div>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Título</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {trends.map((t) => (
              <tr key={t.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium text-brand-navy">
                  <div className="flex flex-wrap items-center gap-2">
                    <span>{t.title}</span>
                    {trendMentionsArxiv(t) && (
                      <span className="rounded-full border border-amber-300 bg-amber-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-amber-950">
                        arXiv
                      </span>
                    )}
                  </div>
                  {trendMentionsArxiv(t) && (
                    <p className="mt-2 max-w-md text-xs font-semibold leading-snug text-amber-900">
                      {EDITORIAL_ARXIV_ALERT_ES} La publicación directa desde esta tabla pedirá confirmación.
                    </p>
                  )}
                </td>
                <td className="px-4 py-3">{t.trendScore}</td>
                <td className="px-4 py-3 text-xs font-semibold uppercase">{t.status}</td>
                <td className="max-w-[180px] truncate px-4 py-3 text-xs text-slate-500" title={t.slug}>
                  {t.slug}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex flex-wrap justify-end gap-2">
                    <Link
                      href={
                        t.status === "published"
                          ? `/tendencia/${t.slug}`
                          : `/admin/preview/${t.slug}`
                      }
                      className="text-xs font-semibold text-slate-400 underline decoration-dotted hover:text-brand-orange"
                      prefetch={false}
                    >
                      {t.status === "published" ? "Ver público" : "Vista previa"}
                    </Link>
                    <button
                      type="button"
                      onClick={() => publish(t)}
                      disabled={busy !== null || batchBusy}
                      className="rounded-full bg-brand-navy px-3 py-1 text-xs font-bold text-white disabled:opacity-50"
                    >
                      {busy === `pub-${t.id}` ? "…" : "Publicar"}
                    </button>
                    <button
                      type="button"
                      onClick={() => reject(t.id)}
                      disabled={busy !== null || batchBusy}
                      className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-bold text-red-700 disabled:opacity-50"
                    >
                      {busy === `rej-${t.id}` ? "…" : "Rechazar"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
