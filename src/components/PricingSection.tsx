import Link from "next/link";
import { Check } from "lucide-react";

const freeItems = ["Acceso a artículos básicos", "Resumen semanal", "Newsletter"] as const;
const premiumItems = [
  "Todos los artículos y análisis",
  "Reportes exclusivos",
  "Radar de tendencias",
  "Herramientas y plantillas",
  "Sin publicidad",
] as const;

export function PricingSection() {
  return (
    <section
      id="pricing"
      className="scroll-mt-28 w-full border-t border-slate-200 bg-gradient-to-b from-slate-50 via-white to-slate-50/80 py-16 md:py-20 lg:py-24"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <header className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-black tracking-tight text-brand-navy md:text-4xl">Elige tu plan</h2>
          <p className="mt-3 text-base leading-relaxed text-slate-600 md:text-lg">
            Empieza gratis y desbloquea análisis completos cuando estés listo.
          </p>
        </header>

        <div className="mt-12 grid min-w-0 gap-8 lg:grid-cols-2 lg:gap-10">
          {/* Gratis */}
          <div className="flex min-h-0 min-w-0 flex-col rounded-3xl border border-slate-200/90 bg-white p-8 shadow-soft sm:p-10 lg:min-h-[28rem]">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Gratis</p>
            <p className="mt-4 text-5xl font-black tabular-nums tracking-tight text-brand-navy md:text-6xl">$0</p>
            <p className="mt-1 text-lg font-bold text-slate-600 md:text-xl">MXN/mes</p>
            <ul className="mt-10 flex flex-1 flex-col gap-4 text-base leading-snug text-slate-700">
              {freeItems.map((item) => (
                <li key={item} className="flex gap-3">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" strokeWidth={2.5} aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/#newsletter"
              className="mt-10 flex w-full min-h-[52px] items-center justify-center rounded-2xl border-2 border-slate-200 bg-white px-6 py-3.5 text-base font-black text-brand-navy transition hover:border-brand-navy hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2"
            >
              Comenzar gratis
            </Link>
          </div>

          {/* Premium */}
          <div className="relative flex min-h-0 min-w-0 flex-col overflow-hidden rounded-3xl border-2 border-brand-orange bg-gradient-to-b from-brand-navy via-brand-navy to-slate-950 p-8 text-white shadow-lift sm:p-10 lg:min-h-[28rem]">
            <span className="absolute right-5 top-5 rounded-full bg-brand-orange px-4 py-1.5 text-[11px] font-black uppercase tracking-wide text-white shadow-md shadow-orange-900/30">
              Más popular
            </span>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-200/95">Premium</p>
            <p className="mt-4 text-5xl font-black tabular-nums tracking-tight text-white md:text-6xl">$99</p>
            <p className="mt-1 text-lg font-bold text-white/90 md:text-xl">MXN/mes</p>
            <p className="mt-3 text-sm font-medium text-amber-100/90">Ahorra con plan anual próximamente</p>
            <ul className="mt-8 flex flex-1 flex-col gap-4 text-base leading-snug text-white/95">
              {premiumItems.map((item) => (
                <li key={item} className="flex gap-3">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-brand-orange" strokeWidth={2.5} aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/#newsletter"
              className="mt-10 flex w-full min-h-[52px] items-center justify-center rounded-2xl bg-brand-orange px-6 py-3.5 text-base font-black text-white shadow-lg shadow-orange-900/25 transition hover:bg-orange-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-navy"
            >
              Ser Premium
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
