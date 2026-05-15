"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { signIn, SessionProvider } from "next-auth/react";
import { Loader2 } from "lucide-react";

function LoginForm({ googleEnabled }: { googleEnabled: boolean }) {
  const searchParams = useSearchParams();
  const callbackUrl =
    searchParams.get("callbackUrl") ?? searchParams.get("next") ?? "/";
  const intent = searchParams.get("intent");
  const [error, setError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const safeCallback =
    callbackUrl.startsWith("/") && !callbackUrl.startsWith("//") ? callbackUrl : "/";
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
          <Image src="/branding/logo-icon.png" alt="" width={64} height={64} className="h-16 w-16 rounded-2xl shadow-lg ring-1 ring-slate-200/80" />
          <span className="text-sm font-bold text-brand-orange hover:underline">Volver al inicio</span>
        </Link>
<div className="mt-10 rounded-[2rem] border border-slate-200/80 bg-white p-8 shadow-lift md:p-10">
          <h1 className="text-center text-2xl font-black tracking-tight text-brand-navy md:text-3xl">
            {intent === "premium" ? "Accede a Premium" : "Iniciar sesión"}
          </h1>
          <p className="mt-3 text-center text-sm leading-relaxed text-slate-600">
            Usa tu cuenta de Google para entrar a Notitendencias.
          </p>
          {intent === "premium" && (
<div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50/80 px-4 py-3 text-center text-xs font-semibold text-amber-950">
              Pagos próximamente. Durante la beta el acceso Premium es por invitación o asignación manual.
</div>
          )}
<div className="mt-8">
            {googleEnabled ? (
              <button type="button" disabled={googleLoading} onClick={() => void onGoogle()}
                className="flex w-full min-h-[52px] items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white text-base font-bold text-brand-navy shadow-sm ring-1 ring-slate-100 transition hover:bg-slate-50 disabled:opacity-60">
                {googleLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                Continuar con Google
              </button>
            ) : (
<div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-center text-sm font-semibold text-amber-950">
                Google no está configurado. Define AUTH_GOOGLE_ID y AUTH_GOOGLE_SECRET en Coolify.
</div>
            )}
</div>
          {error && (
<div className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-800 ring-1 ring-red-100">
              {error}
</div>
          )}
          <p className="mt-6 text-center text-xs text-slate-500">
            Al continuar aceptas nuestra política de privacidad.
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
