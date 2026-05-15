import Link from "next/link";
import type { Trend } from "@/db/schema";
import { NewsletterBox } from "@/components/NewsletterBox";
import { TrendScoreBadge } from "@/components/TrendScoreBadge";

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
    <article className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-slate-600">
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase text-amber-900">
          {t.categorySlug}
        </span>
        <TrendScoreBadge score={t.trendScore} />
        {t.publishedAt && (
          <time dateTime={t.publishedAt.toISOString()}>
            {new Date(t.publishedAt).toLocaleDateString("es-MX", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </time>
        )}
      </div>
      <h1 className="text-3xl font-black leading-tight text-brand-navy md:text-4xl">{t.title}</h1>
      <p className="mt-6 text-lg text-slate-700">{t.summary}</p>

      {t.whyItMatters && (
        <section className="mt-10">
          <h2 className="text-xl font-bold text-brand-navy">Por qué importa</h2>
          <p className="mt-2 text-slate-700">{t.whyItMatters}</p>
        </section>
      )}
      {t.opportunity && (
        <section className="mt-10">
          <h2 className="text-xl font-bold text-brand-navy">Oportunidad</h2>
          <p className="mt-2 text-slate-700">{t.opportunity}</p>
        </section>
      )}

      {contentIdeas.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold text-brand-navy">Ideas de contenido</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-700">
            {contentIdeas.map((idea) => (
              <li key={idea}>{idea}</li>
            ))}
          </ul>
        </section>
      )}

      {businessIdeas.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold text-brand-navy">Ideas de negocio</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-700">
            {businessIdeas.map((idea) => (
              <li key={idea}>{idea}</li>
            ))}
          </ul>
        </section>
      )}

      {tags.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      <section className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Fuente original</h2>
        <p className="mt-1 font-medium text-brand-navy">{t.sourceName ?? "—"}</p>
        {t.sourceUrl && (
          <a
            href={t.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block break-all text-sm text-brand-orange hover:underline"
          >
            {t.sourceUrl}
          </a>
        )}
      </section>

      {showNewsletter && (
        <div className="mt-12">
          <NewsletterBox />
        </div>
      )}

      <p className="mt-8 text-center">
        <Link href={backFooter.href} className="text-sm font-semibold text-brand-orange hover:underline">
          {backFooter.label}
        </Link>
      </p>
    </article>
  );
}
