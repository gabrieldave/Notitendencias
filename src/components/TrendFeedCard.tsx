import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Trend } from "@/db/schema";
import { categoryDisplayName } from "@/lib/category-display";
import { formatFeedTimestamp } from "@/lib/feed-date";
import { trendRadarInstant } from "@/lib/trend-radar-instant";
import { TrendScoreBadge } from "@/components/TrendScoreBadge";

type Props = { trend: Trend; titlesOnly?: boolean };

export function TrendFeedCard({ trend: t, titlesOnly = false }: Props) {
  const to = `/tendencia/${t.slug}`;

  if (titlesOnly) {
    return (
      <article className="rounded-2xl border border-slate-200/90 bg-white px-5 py-5 shadow-sm md:px-7 md:py-6">
        <h2 className="text-xl font-black leading-snug tracking-tight text-brand-navy md:text-2xl">
          <Link
            href={to}
            className="transition hover:text-brand-orange focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2"
          >
            {t.title}
          </Link>
        </h2>
      </article>
    );
  }

  const ts = trendRadarInstant(t);
  const iso = ts instanceof Date ? ts.toISOString() : new Date(ts).toISOString();
  const tags = (t.tags as string[] | null)?.slice(0, 7) ?? [];
  const insightRaw = t.opportunity?.trim() || t.whyItMatters?.trim() || null;
  const insightLabel = t.opportunity?.trim() ? "Oportunidad" : t.whyItMatters?.trim() ? "Por qué importa" : null;

  return (
    <article className="group rounded-2xl border border-slate-200/90 bg-white px-5 py-6 shadow-sm transition hover:border-brand-orange/40 hover:shadow-md md:px-7 md:py-7">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1.5 text-[13px] leading-tight text-slate-600">
        <span className="font-bold text-brand-navy">{categoryDisplayName(t.categorySlug)}</span>
        <span className="hidden text-slate-300 sm:inline" aria-hidden>
          ·
        </span>
        <TrendScoreBadge score={t.trendScore} size="sm" />
        <span className="hidden text-slate-300 sm:inline" aria-hidden>
          ·
        </span>
        <time dateTime={iso} className="font-semibold tabular-nums text-slate-800">
          {formatFeedTimestamp(ts)}
        </time>
      </div>

      <h2 className="mt-4 text-xl font-black leading-snug tracking-tight text-brand-navy md:text-2xl">
        <Link
          href={to}
          className="transition hover:text-brand-orange focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2"
        >
          {t.title}
        </Link>
      </h2>

      <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-600 md:text-[15px]">{t.summary}</p>

      {insightRaw && insightLabel && (
        <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/90 px-4 py-3">
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-brand-orange">{insightLabel}</p>
          <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-slate-700">{insightRaw}</p>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
        {t.sourceName ? (
          <span>
            Fuente: <span className="font-semibold text-slate-700">{t.sourceName}</span>
          </span>
        ) : null}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span key={tag} className="rounded-md bg-slate-100/90 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <Link
        href={to}
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-orange px-5 py-2.5 text-sm font-black text-white shadow-md shadow-orange-500/20 transition hover:bg-orange-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy focus-visible:ring-offset-2"
      >
        Leer análisis
        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
      </Link>
    </article>
  );
}
