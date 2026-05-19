import Link from "next/link";
import type { Trend } from "@/db/schema";
import { TrendCardCompact } from "@/components/TrendCardCompact";

type Props = {
  topToday: Trend[];
  topScore: Trend[];
  titlesOnly?: boolean;
  /** Sin CTA «Unirme al radar» para miembros premium */
  hideUpsell?: boolean;
};

export function RadarSidebar({ topToday, topScore, titlesOnly = false, hideUpsell = false }: Props) {
  return (
    <aside className="mx-auto w-full max-w-sm shrink-0 space-y-6 lg:sticky lg:top-28 lg:max-w-[280px]">
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-black uppercase tracking-wide text-brand-navy">Top hoy</h3>
        <p className="mt-1 text-xs text-slate-500">
          {titlesOnly ? "Solo titulares visibles · desbloquea AI Radar para el análisis" : "Señales más recientes del día"}
        </p>
        {topToday.length === 0 ? (
          <p className="mt-4 text-sm leading-relaxed text-slate-500">
            Aún no hay publicaciones hoy. Vuelve más tarde o mira el feed principal.
          </p>
        ) : (
          <div className="mt-4 flex flex-col divide-y divide-slate-100">
            {topToday.map((t, i) => (
              <TrendCardCompact key={t.id} trend={t} rank={i + 1} titlesOnly={titlesOnly} />
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-black uppercase tracking-wide text-brand-navy">Mayor score</h3>
        <p className="mt-1 text-xs text-slate-500">
          {titlesOnly ? "Titulares por score editorial · detalle con membresía" : "Prioridad editorial ahora"}
        </p>
        {topScore.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">Sin datos.</p>
        ) : (
          <div className="mt-4 flex flex-col divide-y divide-slate-100">
            {topScore.map((t, i) => (
              <TrendCardCompact key={t.id} trend={t} rank={i + 1} titlesOnly={titlesOnly} />
            ))}
          </div>
        )}
      </div>

      {!hideUpsell && (
      <div className="rounded-2xl border border-brand-orange/25 bg-gradient-to-br from-white to-amber-50/40 p-5 shadow-sm">
        <p className="text-sm font-bold text-brand-navy">Notitendencias AI Radar</p>
        <p className="mt-2 text-xs leading-relaxed text-slate-600">
          Una sola membresía con todo desbloqueado cuando activemos pagos.
        </p>
        <Link
          href="/ia#pricing"
          className="mt-4 flex min-h-[44px] w-full items-center justify-center rounded-xl bg-brand-orange px-4 py-2.5 text-center text-sm font-black text-white shadow-md transition hover:bg-orange-600"
        >
          Unirme al radar
        </Link>
      </div>
      )}
    </aside>
  );
}
