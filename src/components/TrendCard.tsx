import Link from "next/link";
import type { Trend } from "@/db/schema";
import { TrendScoreBadge } from "./TrendScoreBadge";

type Props = { trend: Trend; href?: string };

export function TrendCard({ trend, href }: Props) {
  const to = href ?? `/tendencia/${trend.slug}`;
  const tags = (trend.tags as string[] | null)?.slice(0, 4) ?? [];
  return (
    <article className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-orange/40 hover:shadow-md">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-amber-900">
          {trend.categorySlug}
        </span>
        <TrendScoreBadge score={trend.trendScore} />
      </div>
      <h3 className="text-lg font-bold text-brand-navy group-hover:text-brand-orange">
        <Link href={to}>{trend.title}</Link>
      </h3>
      <p className="mt-2 line-clamp-3 flex-1 text-sm text-slate-600">{trend.summary}</p>
      <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
        {trend.sourceName && <span>Fuente: {trend.sourceName}</span>}
        {trend.publishedAt && (
          <span>
            {new Date(trend.publishedAt).toLocaleDateString("es-MX", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        )}
      </div>
      {tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {tags.map((t) => (
            <span
              key={t}
              className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700"
            >
              #{t}
            </span>
          ))}
        </div>
      )}
      <Link
        href={to}
        className="mt-4 inline-flex w-fit items-center rounded-full bg-brand-navy px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-orange"
      >
        Leer más
      </Link>
    </article>
  );
}
