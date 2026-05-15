"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ChevronDown, Loader2, Menu, X } from "lucide-react";
import { signOut } from "next-auth/react";
import type { PublicUser } from "@/lib/session-user";

const mainNav = [
  { href: "/", label: "Inicio" },
  { href: "/#historias", label: "Tendencias" },
  { href: "/ia", label: "IA" },
  { href: "/categoria/negocios", label: "Negocios" },
  { href: "/categoria/tecnologia", label: "Tecnología" },
  { href: "/categoria/creadores", label: "Creadores" },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  if (href.startsWith("/#")) return false;
  if (href === "/ia") return pathname === "/ia" || pathname.startsWith("/ia/");
  return pathname === href || pathname.startsWith(`${href}/`);
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
          await signOut({ callbackUrl: "/" });
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
  const [moreOpen, setMoreOpen] = useState(false);
  const premium = user?.plan === "premium";

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 shadow-[0_1px_0_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.08)] backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:py-5">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2"
          onClick={() => setOpen(false)}
        >
          <Image
            src="/branding/logo-icon.png"
            alt=""
            width={48}
            height={48}
            className="h-11 w-11 rounded-2xl shadow-md ring-1 ring-slate-200/80 md:h-12 md:w-12"
            priority
          />
          <Image
            src="/branding/logo-wordmark.png"
            alt="Notitendencias"
            width={220}
            height={52}
            className="hidden h-10 w-auto sm:block md:h-11"
            priority
          />
          <span className="sr-only">Notitendencias — inicio</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Principal">
          {mainNav.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`border-b-2 border-transparent px-3 py-2 text-sm font-semibold transition ${
                  active
                    ? "border-brand-orange text-brand-orange"
                    : "text-slate-600 hover:border-slate-200 hover:text-brand-navy"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <div className="relative">
            <button
              type="button"
              className="flex items-center gap-0.5 rounded-full px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
              aria-expanded={moreOpen}
              onClick={() => setMoreOpen(!moreOpen)}
            >
              Más
              <ChevronDown className={`h-4 w-4 transition ${moreOpen ? "rotate-180" : ""}`} aria-hidden />
            </button>
            {moreOpen && (
              <>
                <button
                  type="button"
                  className="fixed inset-0 z-40 cursor-default bg-transparent"
                  aria-label="Cerrar menú"
                  onClick={() => setMoreOpen(false)}
                />
                <div className="absolute right-0 top-full z-50 mt-1 min-w-[12rem] rounded-2xl border border-slate-200 bg-white py-2 shadow-lift">
                  <Link
                    href="/#categorias"
                    className="block px-4 py-2 text-sm font-medium text-brand-navy hover:bg-amber-50"
                    onClick={() => setMoreOpen(false)}
                  >
                    Todas las categorías
                  </Link>
                  <Link
                    href="/categoria/dinero"
                    className="block px-4 py-2 text-sm font-medium text-brand-navy hover:bg-amber-50"
                    onClick={() => setMoreOpen(false)}
                  >
                    Dinero
                  </Link>
                  <Link
                    href="/categoria/entretenimiento"
                    className="block px-4 py-2 text-sm font-medium text-brand-navy hover:bg-amber-50"
                    onClick={() => setMoreOpen(false)}
                  >
                    Entretenimiento
                  </Link>
                </div>
              </>
            )}
          </div>
        </nav>

        <div className="hidden flex-wrap items-center justify-end gap-2 sm:flex sm:gap-3">
          {user ? (
            <>
              {premium && (
                <span className="rounded-full bg-gradient-to-r from-amber-100 to-amber-50 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-amber-950 ring-1 ring-amber-200/80">
                  Premium
                </span>
              )}
              <Link
                href="/mi-radar"
                className="rounded-full px-4 py-2.5 text-sm font-bold text-brand-navy ring-1 ring-slate-200 transition hover:bg-slate-50"
              >
                Mi radar
              </Link>
              <LogoutButton className="rounded-full px-4 py-2.5 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-50 hover:text-brand-navy disabled:opacity-60" />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full px-4 py-2.5 text-sm font-bold text-brand-navy ring-1 ring-slate-200 transition hover:bg-slate-50"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/#newsletter"
                className="rounded-full bg-brand-orange px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-orange-500/35 ring-2 ring-brand-orange/40 transition hover:bg-orange-600 hover:shadow-orange-500/45"
              >
                Suscribirme
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="inline-flex rounded-full p-2 text-brand-navy ring-1 ring-slate-200 hover:bg-slate-50 lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen(!open)}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          <span className="sr-only">{open ? "Cerrar menú" : "Abrir menú"}</span>
        </button>
      </div>

      {open && (
        <div id="mobile-nav" className="border-t border-slate-100 bg-white px-4 py-4 lg:hidden">
          <nav className="flex flex-col gap-1" aria-label="Móvil">
            {mainNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-xl px-3 py-3 text-base font-semibold ${
                  isActive(pathname, item.href) ? "bg-brand-orange/10 text-brand-orange" : "text-brand-navy"
                }`}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/#categorias"
              className="rounded-xl px-3 py-3 text-base font-semibold text-brand-navy"
              onClick={() => setOpen(false)}
            >
              Categorías
            </Link>
            {user ? (
              <>
                {premium && (
                  <span className="mx-3 mt-2 inline-flex w-fit rounded-full bg-amber-100 px-3 py-1 text-xs font-black uppercase text-amber-950">
                    Premium
                  </span>
                )}
                <Link
                  href="/mi-radar"
                  className="mt-2 rounded-xl px-3 py-3 text-base font-semibold text-brand-navy"
                  onClick={() => setOpen(false)}
                >
                  Mi radar
                </Link>
                <LogoutButton className="w-full rounded-xl py-3 text-center text-base font-semibold text-slate-600" />
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="mt-2 rounded-xl px-3 py-3 text-base font-semibold text-brand-navy"
                  onClick={() => setOpen(false)}
                >
                  Iniciar sesión
                </Link>
                <Link
                  href="/#newsletter"
                  className="mt-2 rounded-xl bg-brand-orange py-3.5 text-center text-base font-black text-white shadow-lg shadow-orange-500/30"
                  onClick={() => setOpen(false)}
                >
                  Suscribirme
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
