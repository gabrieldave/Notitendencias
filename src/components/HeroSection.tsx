import Link from "next/link";
import { Activity, BarChart3, Radio, Zap } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-slate-200/80 bg-gradient-to-b from-slate-50 via-white to-white">
      <div className="pointer-events-none absolute -right-32 top-20 h-96 w-96 rounded-full bg-brand-orange/15 blur-3xl" />
      <div className="pointer-events-none absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-sky-400/10 blur-3xl" />
      <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-14 md:py-20 lg:grid-cols-2 lg:items-center lg:gap-16 lg:py-24">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-brand-orange/25 bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-[0.15em] text-brand-orange shadow-sm">
            <Radio className="h-3.5 w-3.5" aria-hidden />
            México · señales digitales
          </p>
          <h1 className="mt-6 text-4xl font-black leading-[1.1] tracking-tight text-brand-navy md:text-5xl lg:text-[3.25rem]">
            Las tendencias digitales más importantes,{" "}
            <span className="text-brand-orange">resumidas</span> y convertidas en ideas útiles.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600 md:text-xl">
            Rastreamos señales del internet, filtramos el ruido y te entregamos contenido claro,
            accionable y lleno de oportunidades.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/#historias"
              className="inline-flex items-center justify-center rounded-full bg-brand-orange px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition hover:bg-orange-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy focus-visible:ring-offset-2"
            >
              Explorar tendencias
            </Link>
            <Link
              href="/#newsletter"
              className="inline-flex items-center justify-center rounded-full border-2 border-slate-200 bg-white px-8 py-3.5 text-sm font-bold text-brand-navy transition hover:border-brand-navy focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2"
            >
              Unirme al newsletter
            </Link>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-lg lg:mx-0 lg:max-w-none">
          <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-tr from-brand-orange/10 via-transparent to-brand-navy/5 blur-2xl" />
          <div className="relative grid gap-4 rounded-[2rem] border border-slate-200/80 bg-white/90 p-5 shadow-lift backdrop-blur-sm sm:grid-cols-2 sm:p-6">
            <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-brand-navy to-slate-900 p-5 text-white shadow-lg sm:col-span-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-white/70">Radar editorial</p>
                  <p className="mt-2 text-2xl font-black tabular-nums">+1.2k</p>
                  <p className="text-sm text-white/80">señales analizadas esta semana</p>
                </div>
                <BarChart3 className="h-10 w-10 shrink-0 text-brand-orange opacity-90" aria-hidden />
              </div>
              <div className="mt-4 flex h-14 items-end gap-1">
                {[40, 65, 45, 80, 55, 90, 70, 95].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t-md bg-gradient-to-t from-brand-orange/40 to-brand-orange"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 to-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-amber-900">
                <Zap className="h-5 w-5 text-brand-orange" aria-hidden />
                <span className="text-xs font-bold uppercase tracking-wide">Impacto alto</span>
              </div>
              <p className="mt-3 text-sm font-semibold text-brand-navy">IA aplicada · creadores</p>
              <p className="mt-1 text-xs text-slate-600">Momentum creciente en búsquedas y conversaciones.</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-slate-500">
                <Activity className="h-5 w-5 text-brand-orange" aria-hidden />
                <span className="text-xs font-bold uppercase tracking-wide">En vivo</span>
              </div>
              <ul className="mt-3 space-y-2 text-xs font-medium text-brand-navy">
                <li className="flex justify-between gap-2">
                  <span>Negocios</span>
                  <span className="text-brand-orange">+24%</span>
                </li>
                <li className="flex justify-between gap-2">
                  <span>Tecnología</span>
                  <span className="text-brand-orange">+18%</span>
                </li>
                <li className="flex justify-between gap-2">
                  <span>Creadores</span>
                  <span className="text-brand-orange">+31%</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
