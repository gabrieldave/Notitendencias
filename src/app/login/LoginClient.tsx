"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Loader2, Mail } from "lucide-react";

export function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";
  const intent = searchParams.get("intent");

  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "No se pudo iniciar sesión");
        setLoading(false);
        return;
      }
      router.push(next.startsWith("/") ? next : "/");
      router.refresh();
    } catch {
      setError("Error de red. Intenta de nuevo.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-12rem)] bg-gradient-to-b from-slate-50 via-white to-amber-50/30">
      <div className="mx-auto flex max-w-lg flex-col px-4 py-14 md:py-20">
        <Link href="/" className="mx-auto flex flex-col items-center gap-3 text-center">
          <Image
            src="/branding/logo-icon.png"
            alt=""
            width={64}
            height={64}
            className="h-16 w-16 rounded-2xl shadow-lg ring-1 ring-slate-200/80"
          />
          <span className="text-sm font-bold text-brand-orange hover:underline">Volver al inicio</span>
        </Link>

        <div className="mt-10 rounded-[2rem] border border-slate-200/80 bg-white p-8 shadow-lift md:p-10">
          <h1 className="text-center text-2xl font-black tracking-tight text-brand-navy md:text-3xl">
            {intent === "premium" ? "Accede a Premium" : "Iniciar sesión"}
          </h1>
          <p className="mt-3 text-center text-sm leading-relaxed text-slate-600">
            MVP sin contraseña: ingresa tu correo y abrimos tu sesión al instante.{" "}
            <span className="font-semibold text-brand-navy">No enviamos enlaces mágicos todavía.</span>
          </p>
          {intent === "premium" && (
            <p className="mt-4 rounded-2xl border border-amber-100 bg-amber-50/80 px-4 py-3 text-center text-xs font-semibold text-amber-950">
              Pagos próximamente. Durante la beta el acceso Premium es por invitación o asignación manual.
            </p>
          )}

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500" htmlFor="email">
              Correo electrónico
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(ev) => setEmail(ev.target.value)}
                placeholder="tu@correo.com"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3.5 pl-12 pr-4 text-base font-medium text-brand-navy outline-none ring-brand-orange/30 transition placeholder:text-slate-400 focus:border-brand-orange focus:bg-white focus:ring-4"
              />
            </div>
            {error && (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-800 ring-1 ring-red-100">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-brand-orange text-base font-black text-white shadow-lg shadow-orange-500/30 transition hover:bg-orange-600 disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
              Continuar
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-500">
            Al continuar aceptas recibir comunicaciones editoriales según nuestra política de privacidad.
          </p>
        </div>
      </div>
    </div>
  );
}
