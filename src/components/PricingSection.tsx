import Link from "next/link";
import { Check } from "lucide-react";

export function PricingSection() {
  return (
    <div id="pricing" className="scroll-mt-28">
      <div className="mb-6 text-center">
        <h3 className="text-xl font-black text-brand-navy md:text-2xl">Elige tu plan</h3>
        <p className="mt-1 text-sm text-slate-600">Claro, sin letra pequeña imposible.</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Gratis</p>
          <p className="mt-2 flex items-baseline gap-1">
            <span className="text-4xl font-black text-brand-navy">$0</span>
            <span className="text-sm font-semibold text-slate-500">MXN/mes</span>
          </p>
          <ul className="mt-6 flex flex-1 flex-col gap-3 text-sm text-slate-600">
            {[
              "Acceso a artículos básicos",
              "Resumen semanal",
              "Newsletter",
            ].map((item) => (
              <li key={item} className="flex gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
          <Link
            href="/#newsletter"
            className="mt-8 inline-flex justify-center rounded-full border-2 border-slate-200 py-3 text-sm font-bold text-brand-navy transition hover:border-brand-navy"
          >
            Comenzar gratis
          </Link>
        </div>

        <div className="relative flex flex-col overflow-hidden rounded-3xl border-2 border-brand-orange bg-gradient-to-b from-brand-navy to-slate-950 p-8 text-white shadow-lift">
          <span className="absolute right-4 top-4 rounded-full bg-brand-orange px-3 py-1 text-[10px] font-black uppercase tracking-wide text-white">
            Más popular
          </span>
          <p className="text-xs font-bold uppercase tracking-wide text-amber-200/90">Premium</p>
          <p className="mt-2 flex items-baseline gap-1">
            <span className="text-4xl font-black">$99</span>
            <span className="text-sm font-semibold text-white/70">MXN/mes</span>
          </p>
          <p className="mt-1 text-xs text-amber-200/80">Ahorra con plan anual (próximamente)</p>
          <ul className="mt-6 flex flex-1 flex-col gap-3 text-sm text-white/90">
            {[
              "Todos los artículos y análisis",
              "Reportes exclusivos",
              "Radar de tendencias",
              "Herramientas y plantillas",
              "Sin publicidad",
            ].map((item) => (
              <li key={item} className="flex gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-orange" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
          <Link
            href="/#newsletter"
            className="mt-8 inline-flex justify-center rounded-full bg-brand-orange py-3 text-sm font-black text-white transition hover:bg-orange-500"
          >
            Ser Premium
          </Link>
        </div>
      </div>
    </div>
  );
}
