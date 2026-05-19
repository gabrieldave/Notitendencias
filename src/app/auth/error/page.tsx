import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Error de acceso · Notitendencias",
};

type Props = { searchParams: Promise<{ error?: string }> };

const messages: Record<string, string> = {
  Configuration:
    "Falta configuración en el servidor (suele ser AUTH_SECRET o credenciales Google en Coolify). Revisa docs/google-oauth-coolify.md y vuelve a desplegar.",
  AccessDenied: "No tienes permiso para acceder con esa cuenta.",
  Verification: "La sesión de Google no se pudo completar. Inténtalo de nuevo.",
  OAuthSignin: "No se pudo conectar con Google. Revisa que la app OAuth tenga el redirect correcto.",
  OAuthCallback: "Google respondió pero el servidor no pudo completar el acceso. Revisa logs y migraciones de BD.",
  Default: "No pudimos completar el inicio de sesión. Inténtalo de nuevo.",
};

export default async function AuthErrorPage({ searchParams }: Props) {
  const { error } = await searchParams;
  const key = error && messages[error] ? error : "Default";
  const text = messages[key] ?? messages.Default;

  return (
    <div className="min-h-[calc(100vh-12rem)] bg-gradient-to-b from-slate-50 via-white to-red-50/20">
      <div className="mx-auto flex max-w-lg flex-col px-4 py-16 text-center md:py-24">
        <Link href="/" className="mx-auto">
          <Image
            src="/branding/logo-icon.png"
            alt=""
            width={56}
            height={56}
            className="h-14 w-14 rounded-2xl shadow-md ring-1 ring-slate-200/80"
          />
        </Link>
        <p className="mt-8 text-xs font-black uppercase tracking-[0.2em] text-red-600">Algo salió mal</p>
        <h1 className="mt-3 text-2xl font-black text-brand-navy md:text-3xl">Error de acceso</h1>
        <p className="mt-4 text-sm leading-relaxed text-slate-600">{text}</p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link
            href="/login"
            className="inline-flex rounded-2xl bg-brand-orange px-6 py-3 text-sm font-black text-white shadow-lg shadow-orange-500/30 hover:bg-orange-600"
          >
            Volver a iniciar sesión
          </Link>
          <Link
            href="/"
            className="inline-flex rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-brand-navy hover:border-brand-navy"
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
