import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import type { Trend } from "@/db/schema";
import { TrendScoreBadge } from "./TrendScoreBadge";

type Props = { trend: Trend; href?: string; featured?: boolean };

export function TrendCardHorizontal({ trend, href, featured = false }: Props) {
  const to = href ?? `/tendencia/${trend.slug}`;
  const tags = (trend.tags as string[] | null)?.slice(0, 3) ?? [];

  return (
    <article
      className={`group relative overflow-hidden rounded-3xl border bg-gradient-to-br from-white via-white to-amber-50/40 shadow-soft transition hover:border-brand-orange/35 hover:shadow-lift ${
        featured
          ? "border-2 border-brand-orange/25 p-8 shadow-lift md:p-10 lg:border-brand-orange/30"
          : "border border-slate-200/90 p-6 md:p-8"
      } md:flex md:items-stretch md:gap-8`}
    >
      <div
        className={`relative mb-4 flex shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-brand-navy via-brand-navy to-slate-900 md:mb-0 ${
          featured ? "aspect-[16/10] w-full md:aspect-auto md:w-64 lg:w-72" : "aspect-[16/10] w-full md:aspect-auto md:h-auto md:w-52"
        }`}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(249,115,22,0.35),transparent_50%)]" />
        <Sparkles
          className={`relative text-brand-orange ${featured ? "h-16 w-16 md:h-20 md:w-20" : "h-14 w-14 md:h-16 md:w-16"}`}
          aria-hidden
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-white/90 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-navy shadow-sm ring-1 ring-slate-200 md:text-[11px]">
            {trend.categorySlug}
          </span>
          <TrendScoreBadge score={trend.trendScore} size="md" />
        </div>
        <h3
          className={`font-black leading-tight text-brand-navy ${featured ? "text-2xl md:text-3xl lg:text-4xl" : "text-xl md:text-2xl"}`}
        >
          <Link href={to} className="hover:text-brand-orange">
            {trend.title}
          </Link>
        </h3>
        <p
          className={`mt-2 text-slate-600 ${featured ? "line-clamp-3 text-base md:text-lg" : "line-clamp-2 text-sm md:text-base"}`}
        >
          {trend.summary}
        </p>
        {tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <span key={t} className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                #{t}
              </span>
            ))}
          </div>
        )}
        <Link
          href={to}
          className={
            featured
              ? "mt-6 inline-flex w-full min-h-[52px] max-w-xs items-center justify-center gap-2 rounded-2xl bg-brand-orange px-6 py-3.5 text-base font-black text-white shadow-lg shadow-orange-500/30 transition hover:bg-orange-600 sm:w-auto"
              : "mt-4 inline-flex w-fit items-center gap-2 rounded-full bg-brand-orange px-5 py-2.5 text-sm font-black text-white shadow-md shadow-orange-500/25 transition hover:bg-orange-600"
          }
        >
          Leer más
          <ArrowRight className={`${featured ? "h-5 w-5" : "h-4 w-4"} transition group-hover:translate-x-0.5`} aria-hidden />
        </Link>
      </div>
    </article>
  );
}
