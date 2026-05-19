"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { RadarMembershipCard } from "@/components/RadarMembershipCard";
import type { PublicUser } from "@/lib/session-user";
import { isRadarContentUnlocked } from "@/lib/radar-access";

type Props = {
  title: string;
  slug: string;
  serverUser: PublicUser | null;
  serverUnlocked: boolean;
  backFooter: { href: string; label: string };
};

export function TrendDetailLimitedGate({
  title,
  slug,
  serverUser,
  serverUnlocked,
  backFooter,
}: Props) {
  const router = useRouter();
  const [resolving, setResolving] = useState(!serverUnlocked);

  useEffect(() => {
    if (serverUnlocked || isRadarContentUnlocked(serverUser)) {
      router.refresh();
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/me", { credentials: "same-origin", cache: "no-store" });
        if (!res.ok || cancelled) {
          setResolving(false);
          return;
        }
        const data = (await res.json()) as { radarUnlocked?: boolean };
        if (data.radarUnlocked) {
          router.refresh();
          return;
        }
      } catch {
        /* ignore */
      }
      if (!cancelled) setResolving(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [serverUnlocked, serverUser, router]);

  if (serverUnlocked || isRadarContentUnlocked(serverUser) || resolving) {
    return (
      <article className="mx-auto max-w-3xl px-4 py-16 md:py-20">
        <div className="flex flex-col items-center gap-4 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand-orange" aria-hidden />
          <p className="text-sm font-semibold text-slate-600">Abriendo análisis completo…</p>
        </div>
      </article>
    );
  }

  return (
    <article className="mx-auto max-w-3xl px-4 py-10 md:py-14">
      <h1 className="text-3xl font-black leading-[1.15] tracking-tight text-brand-navy md:text-4xl lg:text-5xl">
        {title}
      </h1>
      <div className="mt-10">
        <RadarMembershipCard serverUser={serverUser} callbackPath={`/tendencia/${slug}`} />
      </div>
      <p className="mt-10 text-center">
        <Link href={backFooter.href} className="text-sm font-bold text-brand-orange hover:underline">
          {backFooter.label}
        </Link>
      </p>
    </article>
  );
}
