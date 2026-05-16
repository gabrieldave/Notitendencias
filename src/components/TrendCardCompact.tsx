import Link from "next/link";
import { Calendar } from "lucide-react";
import type { Trend } from "@/db/schema";
import { categoryDisplayName } from "@/lib/category-display";
import { TrendScoreBadge } from "./TrendScoreBadge";

type Props = {
  trend: Trend;
  rank: number;
  href?: string;
};

export function TrendCardCompact({ trend, rank, href }: Props) {
  const to = href ?? `/tendencia/${trend.slug}`;
  const dateLabel = trend.publishedAt
    ? new Date(trend.publishedAt).toLocaleDateString("es-MX", {
        day: "numeric",
        month: "short",
      })
    : null;

  return (
    <article className="group flex gap-3 rounded-2xl border border-transparent p-2 transition hover:border-slate-200 hover:bg-white hover:shadow-soft">
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-navy to-brand-navy/80 text-sm font-black text-white shadow-sm"
        aria-hidden
      >
        {rank}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wide text-brand-orange">
            {categoryDisplayName(trend.categorySlug)}
          </span>
          <TrendScoreBadge score={trend.trendScore} size="sm" />
        </div>
        <h3 className="mt-0.5 line-clamp-2 text-sm font-bold leading-snug text-brand-navy group-hover:text-brand-orange">
          <Link href={to}>{trend.title}</Link>
        </h3>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
          {dateLabel && (
            <span className="inline-flex items-center gap-0.5">
              <Calendar className="h-3 w-3" aria-hidden />
              {dateLabel}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
