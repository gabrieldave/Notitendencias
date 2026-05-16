import Link from "next/link";
import { ArrowRight, Calendar } from "lucide-react";
import type { Trend } from "@/db/schema";
import { trendRadarInstant } from "@/lib/trend-radar-instant";
import { TrendScoreBadge } from "./TrendScoreBadge";

type Props = { trend: Trend; href?: string; className?: string; prominent?: boolean };

export function TrendCardLarge({ trend, href, className = "", prominent = false }: Props) {
  const to = href ?? `/tendencia/${trend.slug}`;
  const tags = (trend.tags as string[] | null)?.slice(0, 5) ?? [];
  const radarTs = trendRadarInstant(trend);
  const dateLabel = radarTs.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <article
      className={`group flex h-full flex-col rounded-3xl border bg-white shadow-soft transition duration-300 hover:-translate-y-1 hover:border-brand-orange/30 hover:shadow-lift ${
        prominent ? "border-2 border-brand-orange/20 p-8 shadow-lift md:p-10" : "border border-slate-200/90 p-6"
      } ${className}`}
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-brand-navy/5 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-brand-navy ring-1 ring-brand-navy/10">
          {trend.categorySlug}
        </span>
        <TrendScoreBadge score={trend.trendScore} size="md" />
      </div>
      <h3
        className={`font-black leading-snug text-brand-navy transition group-hover:text-brand-orange ${
          prominent ? "text-2xl md:text-3xl" : "text-xl md:text-2xl"
        }`}
      >
        <Link href={to} className="focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2">
          {trend.title}
        </Link>
      </h3>
      <p className="mt-3 line-clamp-3 flex-1 text-sm leading-relaxed text-slate-600 md:text-base">{trend.summary}</p>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
        {trend.sourceName && <span className="font-medium text-slate-600">Fuente · {trend.sourceName}</span>}
        <span className="inline-flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" aria-hidden />
          <time dateTime={radarTs.toISOString()}>{dateLabel}</time>
        </span>
      </div>
      {tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
      <Link
        href={to}
        className={`mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-orange font-black text-white shadow-lg shadow-orange-500/25 transition hover:bg-orange-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy focus-visible:ring-offset-2 sm:w-fit ${
          prominent ? "min-h-[52px] px-8 py-3.5 text-base ring-2 ring-brand-orange/30" : "px-6 py-3 text-sm ring-1 ring-brand-orange/20"
        }`}
      >
        Leer más
        <ArrowRight className={`transition group-hover:translate-x-0.5 ${prominent ? "h-5 w-5" : "h-4 w-4"}`} aria-hidden />
      </Link>
    </article>
  );
}
