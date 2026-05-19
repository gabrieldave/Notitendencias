"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import type { PublicUser } from "@/lib/session-user";
import { stripeRadarCheckoutUrl, stripeRadarPaymentLink } from "@/lib/stripe-public";

type Props = {
  serverUser: PublicUser | null;
  callbackPath?: string;
};

export function RadarMembershipCard({ serverUser, callbackPath = "/ia" }: Props) {
  const { status, data } = useSession();
  const sessionUserId = data?.user?.id;
  const loggedIn = Boolean(serverUser) || (status === "authenticated" && Boolean(sessionUserId));
  const userId = serverUser?.id ?? sessionUserId ?? null;
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
          : "Mantente al día con las señales más importantes de IA, sin ruido y con ideas claras para actuar: contenido, automatización u oportunidades de negocio."}
      </p>
      <p className="mt-4 text-2xl font-black tabular-nums text-brand-orange md:text-3xl">$5 USD / mes</p>
      <p className="mt-1 text-xs font-semibold text-white/60">
        ~ $99 MXN orientativo según tipo de cambio. Precio beta.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {checkoutUrl ? (
          <a
            href={checkoutUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[48px] items-center justify-center rounded-2xl bg-brand-orange px-6 py-3 text-sm font-black text-white shadow-lg shadow-orange-900/30 transition hover:bg-orange-500"
          >
            {loggedIn ? "Activar con Stripe" : "Unirme al radar"}
          </a>
        ) : (
          <Link
            href="/ia#pricing"
            className="inline-flex min-h-[48px] items-center justify-center rounded-2xl bg-brand-orange px-6 py-3 text-sm font-black text-white shadow-lg shadow-orange-900/30 transition hover:bg-orange-500"
          >
            Ver planes
          </Link>
        )}
        {loggedIn ? (
          <Link
            href="/mi-radar"
            className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-white/25 bg-white/5 px-6 py-3 text-sm font-bold text-white backdrop-blur transition hover:bg-white/10"
          >
            Mi radar
          </Link>
        ) : (
          <Link
            href={loginHref}
            className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-white/25 bg-white/5 px-6 py-3 text-sm font-bold text-white backdrop-blur transition hover:bg-white/10"
          >
            Iniciar sesión
          </Link>
        )}
      </div>
    </div>
  );
}
