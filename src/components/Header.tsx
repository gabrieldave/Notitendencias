"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Menu, X } from "lucide-react";
import { signOut } from "next-auth/react";
import { showHeaderAdminNav } from "@/lib/header-admin-nav";
import type { PublicUser } from "@/lib/session-user";
import { stripeRadarPaymentLink } from "@/lib/stripe-public";

/** Una sola sección editorial: feed + pricing en /ia */
const mainNav = [{ href: "/ia", label: "Radar IA" }] as const;

function isActive(pathname: string, href: string): boolean {
  const base = href.split("#")[0] || href;
  if (base === "/ia") return pathname === "/ia" || pathname.startsWith("/ia/");
  return pathname === base || pathname.startsWith(`${base}/`);
}

function SubscribeButton({ className, onClick }: { className: string; onClick?: () => void }) {
  const checkout = stripeRadarPaymentLink();
  if (checkout) {
    return (
      <a
        href={checkout}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        onClick={onClick}
      >
        Suscribirme
      </a>
    );
  }
  return (
    <Link href="/ia#pricing" className={className} onClick={onClick}>
      Suscribirme
    </Link>
  );
}

function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        start(async () => {
          await signOut({ callbackUrl: "/ia" });
          router.refresh();
        });
      }}
      className={className}
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salir"}
    </button>
  );
}

type Props = { user: PublicUser | null };

export function Header({ user }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const premium = user?.plan === "premium";

  return (
    <header className="relative sticky top-0 z-50 border-b border-white/10 bg-gradient-to-r from-brand-navy via-[#0f2848] to-slate-900 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.35)] backdrop-blur-md">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-brand-orange/50 to-transparent" />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(249,115,22,0.12),transparent)]" />

      <div className="relative mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5 md:py-4">
        <Link
          href="/ia"
          className="flex shrink-0 items-center gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-brand-navy"
          onClick={() => setOpen(false)}
        >
          <Image
            src="/branding/logo-icon.png"
            alt=""
            width={48}
            height={48}
            className="h-11 w-11 rounded-2xl shadow-lg ring-1 ring-white/15 md:h-12 md:w-12"
            priority
          />
          <span className="hidden flex-col sm:flex">
            <span className="text-lg font-black leading-none tracking-tight md:text-xl">
              <span className="text-white">Noti</span>
              <span className="text-brand-orange">tendencias</span>
            </span>
            <span className="mt-1 text-[10px] font-semibold leading-tight text-slate-400 md:text-[11px]">
              Señales útiles · Tendencias claras
            </span>
          </span>
          <span className="sr-only">Notitendencias — radar IA</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Principal">
          {mainNav.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  active
                    ? "bg-brand-orange/20 text-brand-orange ring-1 ring-brand-orange/40"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden flex-wrap items-center justify-end gap-2 sm:flex sm:gap-3">
          {user ? (
            <>
              {premium && (
                <Link
                  href="/ia"
                  className="rounded-full bg-gradient-to-r from-amber-400/90 to-brand-orange px-3 py-1 text-[11px] font-black uppercase tracking-wide text-brand-navy shadow-sm"
                >
                  Premium
                </Link>
              )}
              <Link
                href="/mi-radar"
                className="rounded-full px-4 py-2.5 text-sm font-bold text-white ring-1 ring-white/25 transition hover:bg-white/10"
              >
                Mi radar
              </Link>
              {showHeaderAdminNav(user.email) && (
                <Link
                  href="/admin"
                  className="rounded-full px-4 py-2.5 text-sm font-bold text-white/90 ring-1 ring-white/20 transition hover:bg-white/10"
                >
                  Admin
                </Link>
              )}
              <LogoutButton className="rounded-full px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white disabled:opacity-60" />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full px-4 py-2.5 text-sm font-bold text-white ring-1 ring-white/25 transition hover:bg-white/10"
              >
                Iniciar sesión
              </Link>
              <SubscribeButton className="rounded-full bg-brand-orange px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-orange-900/40 ring-2 ring-orange-400/30 transition hover:bg-orange-500" />
            </>
          )}
        </div>

        <button
          type="button"
          className="inline-flex rounded-full p-2 text-white ring-1 ring-white/25 hover:bg-white/10 lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen(!open)}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          <span className="sr-only">{open ? "Cerrar menú" : "Abrir menú"}</span>
        </button>
      </div>

      {open && (
        <div
          id="mobile-nav"
          className="relative border-t border-white/10 bg-brand-navy/98 px-4 py-4 backdrop-blur-lg lg:hidden"
        >
          <nav className="flex flex-col gap-1" aria-label="Móvil">
            {mainNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-xl px-3 py-3 text-base font-semibold ${
                  isActive(pathname, item.href) ? "bg-brand-orange/20 text-brand-orange" : "text-white"
                }`}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            {user ? (
              <>
                {premium && (
                  <span className="mx-3 mt-2 inline-flex w-fit rounded-full bg-amber-400 px-3 py-1 text-xs font-black uppercase text-brand-navy">
                    Premium
                  </span>
                )}
                <Link
                  href="/mi-radar"
                  className="mt-2 rounded-xl px-3 py-3 text-base font-semibold text-white"
                  onClick={() => setOpen(false)}
                >
                  Mi radar
                </Link>
                {showHeaderAdminNav(user.email) && (
                  <Link
                    href="/admin"
                    className="rounded-xl px-3 py-3 text-base font-semibold text-white"
                    onClick={() => setOpen(false)}
                  >
                    Admin
                  </Link>
                )}
                <LogoutButton className="w-full rounded-xl py-3 text-center text-base font-semibold text-slate-300" />
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="mt-2 rounded-xl px-3 py-3 text-base font-semibold text-white"
                  onClick={() => setOpen(false)}
                >
                  Iniciar sesión
                </Link>
                <SubscribeButton
                  className="mt-2 rounded-xl bg-brand-orange py-3.5 text-center text-base font-black text-white"
                  onClick={() => setOpen(false)}
                />
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
