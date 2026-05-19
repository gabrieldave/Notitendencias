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
};

export function TrendSaveButton({ trendId, slug, initialSaved, isLoggedIn, userPlan }: Props) {
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [pending, startTransition] = useTransition();
  const premium = isPremiumPlan(userPlan);

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
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-brand-navy shadow-sm ring-1 ring-slate-100 transition hover:border-brand-orange/40 hover:text-brand-orange"
      >
        <Bookmark className="h-4 w-4" aria-hidden />
        Guardar en Mi radar
      </Link>
    );
  }

  if (!premium) {
    return (
      <Link
        href={upgradeHref}
        className="inline-flex items-center gap-2 rounded-full border border-amber-200/80 bg-gradient-to-r from-amber-50 to-white px-4 py-2 text-sm font-bold text-amber-950 shadow-sm ring-1 ring-amber-100 transition hover:ring-amber-300"
      >
        <Sparkles className="h-4 w-4 text-brand-orange" aria-hidden />
        Activar AI Radar para guardar
      </Link>
    );
  }

  if (saved) {
    return (
      <button
        type="button"
        onClick={() => void unsave()}
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-900 shadow-sm transition hover:bg-emerald-100 disabled:opacity-60"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookmarkCheck className="h-4 w-4" aria-hidden />}
        Guardado en Mi radar
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void save()}
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-full bg-brand-navy px-4 py-2 text-sm font-bold text-white shadow-md shadow-slate-900/15 ring-2 ring-brand-navy/20 transition hover:bg-slate-900 disabled:opacity-60"
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bookmark className="h-4 w-4" aria-hidden />}
      Guardar en Mi radar
    </button>
  );
}
