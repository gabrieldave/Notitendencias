import Link from "next/link";
import { Radar, Sparkles, Newspaper } from "lucide-react";

const bullets = [
  { icon: Radar, label: "Feed cronológico de señales curadas" },
  { icon: Sparkles, label: "Análisis listos para crear y ejecutar" },
  { icon: Newspaper, label: "Newsletter y Mi radar con membresía" },
] as const;

export function PremiumBanner() {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-brand-navy/20 bg-gradient-to-br from-brand-navy via-brand-navy to-slate-950 px-6 py-9 text-white shadow-lift md:px-10 md:py-10">
      <div className="pointer-events-none absolute -right-20 top-0 h-56 w-56 rounded-full bg-brand-orange/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 left-1/4 h-40 w-40 rounded-full bg-sky-500/10 blur-3xl" />
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
        <div className="max-w-2xl flex-1">
          <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-amber-200/95">
            <Radar className="h-4 w-4 text-brand-orange" aria-hidden />
            Notitendencias AI Radar
          </p>
          <h2 className="mt-2 text-2xl font-black leading-tight md:text-3xl lg:text-[2.1rem]">
            Una sola membresía · radar completo de IA
          </h2>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-white/85 md:text-lg">
            Recibe señales explicadas y conviértelas en contenido, automatización o ideas de negocio. Sin comparaciones de
            planes: todo incluido cuando tu cuenta esté activa.
          </p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-3">
            {bullets.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-3 text-base font-medium leading-snug text-white">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/12 ring-1 ring-white/20">
                  <Icon className="h-5 w-5 text-brand-orange" aria-hidden />
                </span>
                {label}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex shrink-0 flex-col items-stretch gap-2 sm:max-w-xs lg:items-end">
          <Link
            href="/ia#pricing"
            className="inline-flex min-h-[56px] items-center justify-center rounded-2xl bg-brand-orange px-10 py-4 text-center text-base font-black text-white shadow-xl shadow-orange-900/35 ring-2 ring-white/20 transition hover:bg-orange-500 hover:shadow-orange-500/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-navy"
          >
            Unirme al radar
          </Link>
          <p className="text-center text-xs leading-snug text-white/55 sm:text-left lg:text-right">
            Cobro en línea próximo · lista de espera vía newsletter
          </p>
        </div>
      </div>
    </section>
  );
}
