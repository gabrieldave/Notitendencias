import Link from "next/link";
import type { Trend } from "@/db/schema";
import { NewsletterBox } from "@/components/NewsletterBox";
import { TrendScoreBadge } from "@/components/TrendScoreBadge";
import { Calendar } from "lucide-react";

type Props = {
  trend: Trend;
  backFooter?: { href: string; label: string };
  showNewsletter?: boolean;
};

export function TrendDetailArticle({
  trend: t,
  backFooter = { href: "/ia", label: "← Volver a IA" },
  showNewsletter = true,
}: Props) {
  const contentIdeas = (t.contentIdeas as string[] | null) ?? [];
  const businessIdeas = (t.businessIdeas as string[] | null) ?? [];
  const tags = (t.tags as string[] | null) ?? [];

  return (
    <article className="mx-auto max-w-3xl px-4 py-10 md:py-14">
      <header className="border-b border-slate-200/90 pb-8">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="rounded-full bg-brand-navy px-3 py-1 text-[11px] font-black uppercase tracking-wider text-white">
            {t.categorySlug}
          </span>
          <TrendScoreBadge score={t.trendScore} size="lg" />
          {t.publishedAt && (
            <span className="inline-flex items-center gap-1.5 text-slate-500">
              <Calendar className="h-4 w-4" aria-hidden />
              <time dateTime={t.publishedAt.toISOString()} className="font-medium">
                {new Date(t.publishedAt).toLocaleDateString("es-MX", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </time>
            </span>
          )}
        </div>
        <h1 className="mt-6 text-3xl font-black leading-[1.15] tracking-tight text-brand-navy md:text-4xl lg:text-5xl">
          {t.title}
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-slate-700 md:text-xl">{t.summary}</p>
      </header>

      {t.whyItMatters && (
        <section className="mt-10 rounded-3xl border border-slate-100 bg-white p-6 shadow-soft md:p-8">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-brand-orange">Por qué importa</h2>
          <p className="mt-3 text-base leading-relaxed text-slate-700 md:text-lg">{t.whyItMatters}</p>
        </section>
      )}
      {t.opportunity && (
        <section className="mt-6 rounded-3xl border border-amber-100 bg-gradient-to-br from-amber-50/80 to-white p-6 shadow-soft md:p-8">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-amber-800">Oportunidad</h2>
          <p className="mt-3 text-base leading-relaxed text-slate-700 md:text-lg">{t.opportunity}</p>
        </section>
      )}

      {contentIdeas.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-black text-brand-navy md:text-2xl">Ideas de contenido</h2>
          <ul className="mt-4 space-y-3">
            {contentIdeas.map((idea) => (
              <li
                key={idea}
                className="flex gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 text-slate-700 shadow-sm"
              >
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-orange" aria-hidden />
                <span className="leading-relaxed">{idea}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {businessIdeas.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-black text-brand-navy md:text-2xl">Ideas de negocio</h2>
          <ul className="mt-4 space-y-3">
            {businessIdeas.map((idea) => (
              <li
                key={idea}
                className="flex gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 text-slate-700 shadow-sm"
              >
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-navy" aria-hidden />
                <span className="leading-relaxed">{idea}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {tags.length > 0 && (
        <div className="mt-10 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      <section className="mt-10 rounded-3xl border border-slate-200 bg-slate-50/80 p-6 md:p-8">
        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Fuente original</h2>
        <p className="mt-2 text-lg font-bold text-brand-navy">{t.sourceName ?? "—"}</p>
        {t.sourceUrl && (
          <a
            href={t.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block break-all text-sm font-semibold text-brand-orange hover:underline"
          >
            {t.sourceUrl}
          </a>
        )}
      </section>

      <div className="mt-10 rounded-3xl border border-brand-navy/15 bg-gradient-to-br from-brand-navy to-slate-900 p-6 text-center text-white shadow-lift md:p-8">
        <p className="text-sm font-bold uppercase tracking-wide text-amber-200/90">Premium</p>
        <p className="mt-2 text-lg font-black md:text-xl">¿Quieres radar completo y reportes?</p>
        <Link
          href="/#pricing"
          className="mt-4 inline-flex rounded-full bg-brand-orange px-6 py-2.5 text-sm font-black text-white hover:bg-orange-500"
        >
          Ver planes
        </Link>
      </div>

      {showNewsletter && (
        <div className="mt-10">
          <NewsletterBox />
        </div>
      )}

      <p className="mt-10 text-center">
        <Link href={backFooter.href} className="text-sm font-bold text-brand-orange hover:underline">
          {backFooter.label}
        </Link>
      </p>
    </article>
  );
}
