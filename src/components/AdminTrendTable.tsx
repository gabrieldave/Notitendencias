"use client";

import type { Trend } from "@/db/schema";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminTrendTable({ trends }: { trends: Trend[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function publish(id: string) {
    setBusy(`pub-${id}`);
    try {
      const res = await fetch(`/api/trends/${id}/publish`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error");
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(null);
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
              <td className="px-4 py-3 font-medium text-brand-navy">{t.title}</td>
              <td className="px-4 py-3">{t.trendScore}</td>
              <td className="px-4 py-3 text-xs font-semibold uppercase">{t.status}</td>
              <td className="max-w-[180px] truncate px-4 py-3 text-xs text-slate-500" title={t.slug}>
                {t.slug}
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex flex-wrap justify-end gap-2">
                  <Link
                    href={`/tendencia/${t.slug}`}
                    className="text-xs font-semibold text-slate-400 underline decoration-dotted hover:text-brand-orange"
                    prefetch={false}
                  >
                    Ver público
                  </Link>
                  <button
                    type="button"
                    onClick={() => publish(t.id)}
                    disabled={busy !== null}
                    className="rounded-full bg-brand-navy px-3 py-1 text-xs font-bold text-white disabled:opacity-50"
                  >
                    {busy === `pub-${t.id}` ? "…" : "Publicar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => reject(t.id)}
                    disabled={busy !== null}
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
  );
}
