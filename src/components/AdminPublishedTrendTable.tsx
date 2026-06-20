"use client";

import { adminApiFetch } from "@/lib/admin-api-fetch";
import type { Trend } from "@/db/schema";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminPublishedTrendTable({ trends }: { trends: Trend[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function unpublish(id: string, title: string) {
    if (
      !confirm(
        `¿Quitar de la web pública?\n\n«${title}»\n\nLa tendencia pasará a «rejected» y dejará de mostrarse en el sitio.`,
      )
    ) {
      return;
    }
    setBusy(id);
    try {
      await adminApiFetch(`/api/trends/${id}/reject`, { method: "POST" });
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(null);
    }
  }

  if (trends.length === 0) {
    return <p className="mt-4 text-sm text-slate-600">No hay tendencias publicadas.</p>;
  }

  return (
    <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">Título</th>
            <th className="px-4 py-3">Score</th>
            <th className="px-4 py-3">Categoría</th>
            <th className="px-4 py-3">Publicada</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {trends.map((t) => (
            <tr key={t.id} className="border-t border-slate-100">
              <td className="px-4 py-3 font-medium text-brand-navy">{t.title}</td>
              <td className="px-4 py-3">{t.trendScore}</td>
              <td className="px-4 py-3 text-xs uppercase text-slate-600">{t.categorySlug}</td>
              <td className="px-4 py-3 text-xs text-slate-500">
                {t.publishedAt
                  ? new Date(t.publishedAt).toLocaleDateString("es-MX", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "—"}
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex flex-wrap justify-end gap-2">
                  <Link
                    href={`/tendencia/${t.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-brand-orange underline"
                  >
                    Ver público
                  </Link>
                  <Link
                    href={`/admin/preview/${t.slug}`}
                    className="text-xs font-semibold text-slate-500 underline"
                  >
                    Vista previa
                  </Link>
                  <button
                    type="button"
                    onClick={() => void unpublish(t.id, t.title)}
                    disabled={busy !== null}
                    className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-bold text-red-700 disabled:opacity-50"
                  >
                    {busy === t.id ? "…" : "Quitar de la web"}
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
