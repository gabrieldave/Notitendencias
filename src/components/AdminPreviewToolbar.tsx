"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { EDITORIAL_ARXIV_ALERT_ES } from "@/lib/editorial";

type Props = {
  trendId: string;
  slug: string;
  status: string;
  /** Contenido detectado con menciones a arXiv: publicar exige confirmación explícita en API. */
  mentionsArxiv?: boolean;
};

export function AdminPreviewToolbar({ trendId, slug, status, mentionsArxiv = false }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<"pub" | "rej" | null>(null);
  const canModerate = status === "draft" || status === "pending";

  async function publish() {
    setBusy("pub");
    try {
      if (mentionsArxiv) {
        const ok = confirm(
          `${EDITORIAL_ARXIV_ALERT_ES}\n\n¿Confirmas publicación manual explícita?`,
        );
        if (!ok) {
          setBusy(null);
          return;
        }
      }
      const res = await fetch(`/api/trends/${trendId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mentionsArxiv ? { confirmEditorialArxiv: true } : {}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? data.error ?? "Error");
      router.push(`/tendencia/${slug}`);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(null);
    }
  }

  async function reject() {
    if (!confirm("¿Rechazar esta tendencia?")) return;
    setBusy("rej");
    try {
      const res = await fetch(`/api/trends/${trendId}/reject`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error");
      router.push("/admin");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-0">
      {mentionsArxiv && canModerate && (
        <p className="border-b border-amber-200 bg-amber-100 px-4 py-2 text-center text-xs font-semibold text-amber-950">
          {EDITORIAL_ARXIV_ALERT_ES}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-center gap-2 bg-amber-50/90 px-4 py-3">
      <Link
        href="/admin"
        className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-brand-navy hover:border-brand-orange"
      >
        Volver al admin
      </Link>
      {canModerate && (
        <>
          <button
            type="button"
            onClick={() => void publish()}
            disabled={busy !== null}
            className="rounded-full bg-brand-navy px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
          >
            {busy === "pub" ? "…" : "Publicar"}
          </button>
          <button
            type="button"
            onClick={() => void reject()}
            disabled={busy !== null}
            className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-700 disabled:opacity-50"
          >
            {busy === "rej" ? "…" : "Rechazar"}
          </button>
        </>
      )}
      {status === "published" && (
        <>
          <Link
            href={`/tendencia/${slug}`}
            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand-orange underline decoration-2 underline-offset-2 hover:no-underline"
          >
            Ver versión pública
          </Link>
          <button
            type="button"
            onClick={() => void reject()}
            disabled={busy !== null}
            className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-700 disabled:opacity-50"
          >
            {busy === "rej" ? "…" : "Quitar de la web"}
          </button>
        </>
      )}
    </div>
    </div>
  );
}
