"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { PublicUser } from "@/lib/session-user";
import { stripeRadarCheckoutUrl, stripeRadarPaymentLink } from "@/lib/stripe-public";

type Props = {
  serverUser: PublicUser | null;
  callbackPath?: string;
};

type MeResponse = {
  user?: { id: string } | null;
  radarUnlocked?: boolean;
};

export function RadarMembershipCard({ serverUser, callbackPath = "/ia" }: Props) {
  const [me, setMe] = useState<MeResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/me", { credentials: "same-origin", cache: "no-store" });
        if (!res.ok || cancelled) return;
        setMe((await res.json()) as MeResponse);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loggedIn = Boolean(serverUser) || Boolean(me?.user?.id);
  const userId = serverUser?.id ?? me?.user?.id ?? null;
  const checkoutUrl = userId ? stripeRadarCheckoutUrl(userId) : stripeRadarPaymentLink();
  const loginHref = `/login?callbackUrl=${encodeURIComponent(callbackPath)}`;

  return (
    <div className="relative mt-10 overflow-hidden rounded-3xl border border-brand-navy/15 bg-gradient-to-br from-brand-navy via-slate-900 to-slate-950 p-8 text-center text-white shadow-lift md:p-10">
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-brand-orange/20 blur-3xl"
        aria-hidden
      />
      <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-200/90">Análisis completo</p>
      <h2 className="mt-3 text-2xl font-black tracking-tight md:text-3xl">
        {loggedIn ? "Activa AI Radar en tu cuenta" : "Únete a Notitendencias AI Radar"}
      </h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/80 md:text-base">
        {loggedIn
          ? "Ya iniciaste sesión. El análisis completo requiere plan premium activo; si ya pagaste y no se desbloquea, entra a Mi radar."
          : "Mantente al día con las señales más importantes de IA, sin ruido y con ideas claras para actuar."}
      </p>
      <p className="mt-4 text-2xl font-black tabular-nums text-brand-orange md:text-3xl">$5 USD / mes</p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {checkoutUrl ? (
          <a
            href={checkoutUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[48px] items-center justify-center rounded-2xl bg-brand-orange px-6 py-3 text-sm font-black text-white shadow-lg transition hover:bg-orange-500"
          >
            {loggedIn ? "Activar con Stripe" : "Unirme al radar"}
          </a>
        ) : (
          <Link
            href="/ia#pricing"
            className="inline-flex min-h-[48px] items-center justify-center rounded-2xl bg-brand-orange px-6 py-3 text-sm font-black text-white"
          >
            Ver planes
          </Link>
        )}
        {loggedIn ? (
          <Link
            href="/mi-radar"
            className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-white/25 bg-white/5 px-6 py-3 text-sm font-bold text-white"
          >
            Mi radar
          </Link>
        ) : (
          <Link
            href={loginHref}
            className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-white/25 bg-white/5 px-6 py-3 text-sm font-bold text-white"
          >
            Iniciar sesión
          </Link>
        )}
      </div>
    </div>
  );
}
