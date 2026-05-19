"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Bookmark, BookmarkCheck, Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import { isPremiumPlan } from "@/lib/membership";

type Props = {
  trendId: string;
  slug: string;
  initialSaved: boolean;
  isLoggedIn: boolean;
  userPlan: string | null;
  /** En el feed: solo icono en la esquina de la tarjeta */
  variant?: "default" | "compact";
};

const compactBtn =
  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border shadow-sm transition disabled:opacity-60";
const defaultBtn =
  "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold shadow-sm transition disabled:opacity-60";

export function TrendSaveButton({
  trendId,
  slug,
  initialSaved,
  isLoggedIn,
  userPlan,
  variant = "default",
}: Props) {
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [pending, startTransition] = useTransition();
  const premium = isPremiumPlan(userPlan);
  const compact = variant === "compact";

  const next = `/tendencia/${encodeURIComponent(slug)}`;
  const loginHref = `/login?callbackUrl=${encodeURIComponent(next)}`;
  const upgradeHref = "/ia#pricing";

  async function save() {
    if (!isLoggedIn) {
      router.push(loginHref);
      return;
    }
    if (!premium) {
      router.push(upgradeHref);
      return;
    }
    startTransition(async () => {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trendId }),
      });
      if (res.ok) {
        setSaved(true);
        router.refresh();
        return;
      }
      if (res.status === 401) {
        router.push(loginHref);
        return;
      }
      if (res.status === 403) {
        router.push(upgradeHref);
      }
    });
  }

  async function unsave() {
    if (!premium) return;
    startTransition(async () => {
      const res = await fetch(`/api/favorites/${encodeURIComponent(trendId)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSaved(false);
        router.refresh();
      }
    });
  }

  if (!isLoggedIn) {
    return (
      <Link
        href={loginHref}
        className={
          compact
            ? `${compactBtn} border-slate-200 bg-white text-brand-navy ring-1 ring-slate-100 hover:border-brand-orange/40 hover:text-brand-orange`
            : `${defaultBtn} border-slate-200 bg-white text-brand-navy ring-1 ring-slate-100 hover:border-brand-orange/40 hover:text-brand-orange`
        }
        aria-label="Iniciar sesión para guardar"
        title="Guardar en Mi radar"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bookmark className="h-4 w-4" aria-hidden />}
        {!compact && "Guardar en Mi radar"}
      </Link>
    );
  }

  if (!premium) {
    return (
      <Link
        href={upgradeHref}
        className={
          compact
            ? `${compactBtn} border-amber-200/80 bg-amber-50 text-amber-950 ring-1 ring-amber-100 hover:ring-amber-300`
            : `${defaultBtn} border-amber-200/80 bg-gradient-to-r from-amber-50 to-white text-amber-950 ring-1 ring-amber-100 hover:ring-amber-300`
        }
        aria-label="Activar AI Radar para guardar"
        title="Activar AI Radar"
      >
        <Sparkles className="h-4 w-4 text-brand-orange" aria-hidden />
        {!compact && "Activar AI Radar para guardar"}
      </Link>
    );
  }

  if (saved) {
    return (
      <button
        type="button"
        onClick={() => void unsave()}
        disabled={pending}
        className={
          compact
            ? `${compactBtn} border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100`
            : `${defaultBtn} border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100`
        }
        aria-label="Quitar de Mi radar"
        title="Guardado en Mi radar"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookmarkCheck className="h-4 w-4" aria-hidden />}
        {!compact && "Guardado en Mi radar"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void save()}
      disabled={pending}
      className={
        compact
          ? `${compactBtn} border-brand-navy/20 bg-brand-navy text-white hover:bg-slate-900`
          : `${defaultBtn} border-transparent bg-brand-navy text-white shadow-md shadow-slate-900/15 ring-2 ring-brand-navy/20 hover:bg-slate-900`
      }
      aria-label="Guardar en Mi radar"
      title="Guardar en Mi radar"
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bookmark className="h-4 w-4" aria-hidden />}
      {!compact && "Guardar en Mi radar"}
    </button>
  );
}
