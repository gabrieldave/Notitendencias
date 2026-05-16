import Link from "next/link";
import type { Trend } from "@/db/schema";
import { NewsletterBox } from "@/components/NewsletterBox";
import { TrendScoreBadge } from "@/components/TrendScoreBadge";
import { categoryDisplayName } from "@/lib/category-display";
import { SOURCE_URL_COLLAPSE_LENGTH } from "@/lib/editorial";
import { trendRadarInstant } from "@/lib/trend-radar-instant";
import { Calendar } from "lucide-react";

export type TrendDetailAccess = "full" | "limited";

type Props = {
  trend: Trend;
  access: TrendDetailAccess;
  backFooter?: { href: string; label: string };
  showNewsletter?: boolean;
  saveButton?: React.ReactNode;
};

function RadarMembershipCard() {
  return (
    <div className="relative mt-10 overflow-hidden rounded-3xl border border-brand-navy/15 bg-gradient-to-br from-brand-navy via-slate-900 to-slate-950 p-8 text-center text-white shadow-lift md:p-10">
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-brand-orange/20 blur-3xl" aria-hidden />
      <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-200/90">Análisis completo</p>
      <h2 className="mt-3 text-2xl font-black tracking-tight md:text-3xl">Únete a Notitendencias AI Radar</h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/80 md:text-base">
        Recibe señales de IA curadas, explicadas y convertidas en oportunidades prácticas para crear contenido,
        automatizar procesos o detectar ideas de negocio.
      </p>
      <p className="mt-4 text-2xl font-black tabular-nums text-brand-orange md:text-3xl">$5 USD / mes</p>
      <p className="mt-1 text-xs font-semibold text-white/60">
        ~ $99 MXN orientativo según tipo de cambio. Precio beta.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/#pricing"
          className="inline-flex min-h-[48px] items-center justify-center rounded-2xl bg-brand-orange px-6 py-3 text-sm font-black text-white shadow-lg shadow-orange-900/30 transition hover:bg-orange-500"
        >
          Unirme al radar
        </Link>
        <Link
          href="/login"
          className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-white/25 bg-white/5 px-6 py-3 text-sm font-bold text-white backdrop-blur transition hover:bg-white/10"
        >
          Iniciar sesión
        </Link>
      </div>
    </div>
  );
}

export function TrendDetailArticle({
  trend: t,
  access,
  backFooter = { href: "/ia", label: "← Volver a IA" },
  showNewsletter = true,
  saveButton,
}: Props) {
  const full = access === "full";

  if (!full) {
    return (
      <article className="mx-auto max-w-3xl px-4 py-10 md:py-14">
        <h1 className="text-3xl font-black leading-[1.15] tracking-tight text-brand-navy md:text-4xl lg:text-5xl">
          {t.title}
        </h1>
        <div className="mt-10">
          <RadarMembershipCard />
        </div>
        <p className="mt-10 text-center">
          <Link href={backFooter.href} className="text-sm font-bold text-brand-orange hover:underline">
            {backFooter.label}
          </Link>
        </p>
      </article>
    );
  }

  const contentIdeas = (t.contentIdeas as string[] | null) ?? [];
  const businessIdeas = (t.businessIdeas as string[] | null) ?? [];
  const tags = (t.tags as string[] | null) ?? [];
  const radarTs = trendRadarInstant(t);

  return (
    <article className="mx-auto max-w-3xl px-4 py-10 md:py-14">
      <header className="border-b border-slate-200/90 pb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="rounded-full bg-brand-navy px-3 py-1 text-[11px] font-black uppercase tracking-wider text-white">
              {categoryDisplayName(t.categorySlug)}
            </span>
            <TrendScoreBadge score={t.trendScore} size="lg" />
            <span className="inline-flex items-center gap-1.5 text-slate-500">
              <Calendar className="h-4 w-4" aria-hidden />
              <time dateTime={radarTs.toISOString()} className="font-medium">
                {radarTs.toLocaleDateString("es-MX", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </time>
            </span>
          </div>
          {saveButton ? <div className="shrink-0">{saveButton}</div> : null}
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
            className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-brand-orange hover:underline"
          >
            {t.sourceUrl.length > SOURCE_URL_COLLAPSE_LENGTH ? "Ver fuente original" : t.sourceUrl}
          </a>
        )}
      </section>

      <div className="mt-10 rounded-3xl border border-brand-navy/10 bg-slate-50 p-6 text-center md:p-8">
        <p className="text-sm font-bold text-brand-navy">¿Te sirvió esta señal?</p>
        <p className="mt-1 text-sm text-slate-600">Explora más en Mi radar o comparte el hallazgo con tu equipo.</p>
        <Link
          href="/mi-radar"
          className="mt-4 inline-flex rounded-full bg-white px-5 py-2 text-sm font-black text-brand-navy ring-1 ring-slate-200 transition hover:ring-brand-orange"
        >
          Ir a Mi radar
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
