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

  const loginHref = `/login?callbackUrl=${encodeURIComponent(`/tendencia/${slug}`)}`;
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
        credentials: "same-origin",
      });
      if (res.ok) {
        setSaved(true);
        router.refresh();
      }
    });
  }

  async function unsave() {
    if (!premium) return;
    startTransition(async () => {
      const res = await fetch(`/api/favorites/${encodeURIComponent(trendId)}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      if (res.ok) {
        setSaved(false);
        router.refresh();
      }
    });
  }

  if (!isLoggedIn) {
    return (
      <Link href={loginHref} className={compact ? `${compactBtn} border-slate-200 bg-white text-brand-navy` : `${defaultBtn} border-slate-200 bg-white text-brand-navy`} aria-label="Iniciar sesión para guardar" title="Guardar en Mi radar">
        <Bookmark className="h-4 w-4" aria-hidden />
        {!compact && "Guardar en Mi radar"}
      </Link>
    );
  }

  if (!premium) {
    return (
      <Link href={upgradeHref} className={compact ? `${compactBtn} border-amber-200/80 bg-amber-50 text-amber-950` : `${defaultBtn} border-amber-200/80 bg-amber-50 text-amber-950`} aria-label="Activar AI Radar" title="Activar AI Radar">
        <Sparkles className="h-4 w-4 text-brand-orange" aria-hidden />
        {!compact && "Activar AI Radar para guardar"}
      </Link>
    );
  }

  if (saved) {
    return (
      <button type="button" onClick={() => void unsave()} disabled={pending} className={compact ? `${compactBtn} border-emerald-200 bg-emerald-50 text-emerald-900` : `${defaultBtn} border-emerald-200 bg-emerald-50 text-emerald-900`} aria-label="Quitar de Mi radar">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookmarkCheck className="h-4 w-4" aria-hidden />}
        {!compact && "Guardado en Mi radar"}
      </button>
    );
  }

  return (
    <button type="button" onClick={() => void save()} disabled={pending} className={compact ? `${compactBtn} bg-brand-navy text-white` : `${defaultBtn} bg-brand-navy text-white`} aria-label="Guardar en Mi radar">
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bookmark className="h-4 w-4" aria-hidden />}
      {!compact && "Guardar en Mi radar"}
    </button>
  );
}
