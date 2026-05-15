import Link from "next/link";
import { ArrowRight, Calendar } from "lucide-react";
import type { Trend } from "@/db/schema";
import { TrendScoreBadge } from "./TrendScoreBadge";

type Props = { trend: Trend; href?: string; className?: string };

export function TrendCardLarge({ trend, href, className = "" }: Props) {
  const to = href ?? `/tendencia/${trend.slug}`;
  const tags = (trend.tags as string[] | null)?.slice(0, 5) ?? [];
  const dateLabel = trend.publishedAt
    ? new Date(trend.publishedAt).toLocaleDateString("es-MX", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <article
      className={`group flex h-full flex-col rounded-3xl border border-slate-200/90 bg-white p-6 shadow-soft transition duration-300 hover:-translate-y-1 hover:border-brand-orange/30 hover:shadow-lift ${className}`}
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-brand-navy/5 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-brand-navy ring-1 ring-brand-navy/10">
          {trend.categorySlug}
        </span>
        <TrendScoreBadge score={trend.trendScore} size="md" />
      </div>
      <h3 className="text-xl font-black leading-snug text-brand-navy transition group-hover:text-brand-orange md:text-2xl">
        <Link href={to} className="focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2">
          {trend.title}
        </Link>
      </h3>
      <p className="mt-3 line-clamp-3 flex-1 text-sm leading-relaxed text-slate-600 md:text-base">{trend.summary}</p>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
        {trend.sourceName && <span className="font-medium text-slate-600">Fuente · {trend.sourceName}</span>}
        {dateLabel && (
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" aria-hidden />
            <time dateTime={trend.publishedAt?.toISOString()}>{dateLabel}</time>
          </span>
        )}
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
        className="mt-5 inline-flex w-fit items-center gap-2 rounded-full bg-brand-orange px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-orange-500/20 transition hover:bg-orange-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy focus-visible:ring-offset-2"
      >
        Leer más
        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
      </Link>
    </article>
  );
}
