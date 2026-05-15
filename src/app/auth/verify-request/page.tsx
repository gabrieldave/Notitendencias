import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Revisa tu correo · Notitendencias",
};

type Props = { searchParams: Promise<{ email?: string }> };

export default async function VerifyRequestPage({ searchParams }: Props) {
  const { email } = await searchParams;
  return (
    <div className="min-h-[calc(100vh-12rem)] bg-gradient-to-b from-slate-50 via-white to-amber-50/30">
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
        <p className="mt-8 text-xs font-black uppercase tracking-[0.2em] text-brand-orange">Casi listo</p>
        <h1 className="mt-3 text-2xl font-black text-brand-navy md:text-3xl">Revisa tu correo</h1>
        <p className="mt-4 text-sm leading-relaxed text-slate-600">
          Si existe una cuenta para{" "}
          <span className="font-bold text-brand-navy">{email ? decodeURIComponent(email) : "tu correo"}</span>, te
          enviamos un enlace para entrar. El enlace caduca en 30 minutos.
        </p>
        <p className="mt-6 text-xs text-slate-500">
          ¿No ves el mensaje? Mira en spam o promociones. Puedes cerrar esta pestaña.
        </p>
        <Link
          href="/login"
          className="mt-10 inline-flex rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-brand-navy ring-1 ring-slate-100 transition hover:border-brand-orange/40"
        >
          Volver al inicio de sesión
        </Link>
      </div>
    </div>
  );
}
