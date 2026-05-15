import Link from "next/link";
import { Crown, FileBarChart, Radar, Wrench, Ban, Sparkles } from "lucide-react";

const features = [
  { icon: FileBarChart, label: "Reportes exclusivos" },
  { icon: Radar, label: "Radar de tendencias" },
  { icon: Wrench, label: "Herramientas y plantillas" },
  { icon: Ban, label: "Sin publicidad" },
  { icon: Sparkles, label: "Acceso premium" },
] as const;

export function PremiumBanner() {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-brand-navy/20 bg-gradient-to-br from-brand-navy via-brand-navy to-slate-950 px-6 py-10 text-white shadow-lift md:px-10 md:py-12">
      <div className="pointer-events-none absolute -right-20 top-0 h-64 w-64 rounded-full bg-brand-orange/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-sky-500/10 blur-3xl" />
      <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-amber-200/90">
            <Crown className="h-4 w-4 text-amber-300" aria-hidden />
            Premium
          </p>
          <h2 className="mt-3 text-2xl font-black leading-tight md:text-3xl lg:text-4xl">
            Accede a análisis exclusivos, reportes y herramientas
          </h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {features.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-3 text-sm font-medium text-white/90">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
                  <Icon className="h-4 w-4 text-brand-orange" aria-hidden />
                </span>
                {label}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex shrink-0 flex-col items-stretch gap-3 sm:flex-row sm:items-center lg:flex-col lg:items-end">
          <Link
            href="/#pricing"
            className="inline-flex items-center justify-center rounded-full bg-brand-orange px-8 py-4 text-center text-sm font-black text-white shadow-lg shadow-orange-900/30 transition hover:bg-orange-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-navy"
          >
            Hacerme Premium
          </Link>
          <p className="text-center text-xs text-white/60 sm:text-left lg:text-right">
            Próximamente · te avisaremos por newsletter
          </p>
        </div>
      </div>
    </section>
  );
}
