"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { Loader2, Mail } from "lucide-react";
import { SessionProvider } from "next-auth/react";

function LoginForm({ googleEnabled }: { googleEnabled: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl =
    searchParams.get("callbackUrl") ?? searchParams.get("next") ?? "/";
  const intent = searchParams.get("intent");

  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const safeCallback =
    callbackUrl.startsWith("/") && !callbackUrl.startsWith("//") ? callbackUrl : "/";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await signIn("email", {
        email,
        redirect: false,
        callbackUrl: safeCallback,
      });
      if (res?.error) {
        setError("No se pudo enviar el enlace. Revisa tu correo o inténtalo más tarde.");
        setLoading(false);
        return;
      }
      router.push(`/auth/verify-request?email=${encodeURIComponent(email)}`);
    } catch {
      setError("Error de red. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  async function onGoogle() {
    setError(null);
    setGoogleLoading(true);
    try {
      await signIn("google", { callbackUrl: safeCallback });
    } catch {
      setError("No se pudo iniciar con Google.");
      setGoogleLoading(false);
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
            Elige Google o recibe un <span className="font-semibold text-brand-navy">enlace mágico</span> por correo
            (válido 30 minutos).
          </p>
          {intent === "premium" && (
            <p className="mt-4 rounded-2xl border border-amber-100 bg-amber-50/80 px-4 py-3 text-center text-xs font-semibold text-amber-950">
              Pagos próximamente. Durante la beta el acceso Premium es por invitación o asignación manual.
            </p>
          )}

          <div className="mt-8">
            {googleEnabled ? (
              <button
                type="button"
                disabled={googleLoading}
                onClick={() => void onGoogle()}
                className="flex w-full min-h-[52px] items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white text-base font-bold text-brand-navy shadow-sm ring-1 ring-slate-100 transition hover:bg-slate-50 disabled:opacity-60"
              >
                {googleLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                Continuar con Google
              </button>
            ) : (
              <p className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-center text-xs font-semibold text-slate-600">
                Google no está configurado en este entorno. Usa el enlace mágico por correo.
              </p>
            )}
          </div>

          {googleEnabled ? (
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center" aria-hidden>
                <span className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs font-black uppercase tracking-wider text-slate-400">
                <span className="bg-white px-3">o con correo</span>
              </div>
            </div>
          ) : (
            <div className="my-6" />
          )}

          <form onSubmit={onSubmit} className="space-y-4">
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
              Enviar enlace mágico
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

export function LoginClient({ googleEnabled }: { googleEnabled: boolean }) {
  return (
    <SessionProvider>
      <LoginForm googleEnabled={googleEnabled} />
    </SessionProvider>
  );
}
