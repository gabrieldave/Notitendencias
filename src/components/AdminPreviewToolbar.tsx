"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  trendId: string;
  slug: string;
  status: string;
};

export function AdminPreviewToolbar({ trendId, slug, status }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<"pub" | "rej" | null>(null);
  const canModerate = status === "draft" || status === "pending";

  async function publish() {
    setBusy("pub");
    try {
      const res = await fetch(`/api/trends/${trendId}/publish`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error");
      router.refresh();
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
        <Link
          href={`/tendencia/${slug}`}
          className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand-orange underline decoration-2 underline-offset-2 hover:no-underline"
        >
          Ver versión pública
        </Link>
      )}
    </div>
  );
}
