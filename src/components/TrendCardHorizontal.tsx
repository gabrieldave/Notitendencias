import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import type { Trend } from "@/db/schema";
import { TrendScoreBadge } from "./TrendScoreBadge";

type Props = { trend: Trend; href?: string };

export function TrendCardHorizontal({ trend, href }: Props) {
  const to = href ?? `/tendencia/${trend.slug}`;
  const tags = (trend.tags as string[] | null)?.slice(0, 3) ?? [];

  return (
    <article className="group relative overflow-hidden rounded-3xl border border-slate-200/90 bg-gradient-to-br from-white via-white to-amber-50/40 p-6 shadow-soft transition hover:border-brand-orange/35 hover:shadow-lift md:flex md:items-stretch md:gap-6 md:p-8">
      <div className="relative mb-4 flex aspect-[16/10] w-full shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-brand-navy via-brand-navy to-slate-900 md:mb-0 md:aspect-auto md:h-auto md:w-52">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(249,115,22,0.35),transparent_50%)]" />
        <Sparkles className="relative h-14 w-14 text-brand-orange md:h-16 md:w-16" aria-hidden />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-white/90 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-navy shadow-sm ring-1 ring-slate-200">
            {trend.categorySlug}
          </span>
          <TrendScoreBadge score={trend.trendScore} size="md" />
        </div>
        <h3 className="text-xl font-black leading-tight text-brand-navy md:text-2xl">
          <Link href={to} className="hover:text-brand-orange">
            {trend.title}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-2 text-sm text-slate-600 md:text-base">{trend.summary}</p>
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
          className="mt-4 inline-flex w-fit items-center gap-2 text-sm font-bold text-brand-orange hover:underline"
        >
          Leer más
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </article>
  );
}
