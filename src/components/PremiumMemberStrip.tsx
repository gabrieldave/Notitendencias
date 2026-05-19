import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

/** Sustituye bloques de venta cuando el usuario ya tiene AI Radar activo. */
export function PremiumMemberStrip({ className = "" }: { className?: string }) {
  return (
    <section
      id="pricing"
      className={`scroll-mt-28 border-t border-emerald-200/80 bg-gradient-to-b from-emerald-50/90 to-white py-12 md:py-14 ${className}`}
    >
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 px-4 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-bold text-emerald-900 shadow-sm">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden />
          AI Radar activo en tu cuenta
        </span>
        <p className="text-sm leading-relaxed text-slate-600">
          Tienes acceso completo al radar, análisis y favoritos. Sin anuncios de membresía.
        </p>
        <Link
          href="/mi-radar"
          className="inline-flex rounded-2xl bg-brand-navy px-6 py-3 text-sm font-black text-white shadow-md transition hover:bg-slate-900"
        >
          Ir a Mi radar
        </Link>
      </div>
    </section>
  );
}
