import Link from "next/link";
import type { Trend } from "@/db/schema";
import type { PublicUser } from "@/lib/session-user";
import { stripeRadarCheckoutUrl, stripeRadarPaymentLink } from "@/lib/stripe-public";
import { NewsletterBox } from "@/components/NewsletterBox";
import { TrendScoreBadge } from "@/components/TrendScoreBadge";
import { categoryDisplayName } from "@/lib/category-display";
import { trendRadarInstant } from "@/lib/trend-radar-instant";
import {
  clampIdeasList,
  deriveActionsToday,
  deriveAudienceLabels,
  deriveOpportunityLevel,
  deriveUrgency,
  estimateReadingMinutes,
  opportunityLevelLabel,
  parseRadarPayload,
  urgencyLabel,
} from "@/lib/trend-radar-display";
import {
  ArrowUpRight,
  Bookmark,
  CheckCircle2,
  Clock,
  Lightbulb,
  Radar,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";

export type TrendDetailAccess = "full" | "limited";

type Props = {
  trend: Trend;
  access: TrendDetailAccess;
  user?: PublicUser | null;
  backFooter?: { href: string; label: string };
  showNewsletter?: boolean;
  saveButton?: React.ReactNode;
};

function RadarMembershipCard({ user }: { user: PublicUser | null }) {
  const loggedIn = Boolean(user);
  const checkoutUrl = loggedIn ? stripeRadarCheckoutUrl(user!.id) : stripeRadarPaymentLink();

  return (
    <div className="relative mt-10 overflow-hidden rounded-3xl border border-brand-navy/15 bg-gradient-to-br from-brand-navy via-slate-900 to-slate-950 p-8 text-center text-white shadow-lift md:p-10">
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-brand-orange/20 blur-3xl" aria-hidden />
      <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-200/90">Análisis completo</p>
      <h2 className="mt-3 text-2xl font-black tracking-tight md:text-3xl">
        {loggedIn ? "Activa AI Radar en tu cuenta" : "Únete a Notitendencias AI Radar"}
      </h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/80 md:text-base">
        {loggedIn
          ? `Ya iniciaste sesión. El análisis completo requiere plan premium activo; si ya pagaste y no se desbloquea, entra a Mi radar.`
          : "Mantente al día con las señales más importantes de IA, sin ruido y con ideas claras para actuar: contenido, automatización u oportunidades de negocio."}
      </p>
      <p className="mt-4 text-2xl font-black tabular-nums text-brand-orange md:text-3xl">$5 USD / mes</p>
      <p className="mt-1 text-xs font-semibold text-white/60">
        ~ $99 MXN orientativo según tipo de cambio. Precio beta.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {checkoutUrl ? (
          <a
            href={checkoutUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[48px] items-center justify-center rounded-2xl bg-brand-orange px-6 py-3 text-sm font-black text-white shadow-lg shadow-orange-900/30 transition hover:bg-orange-500"
          >
            {loggedIn ? "Activar con Stripe" : "Unirme al radar"}
          </a>
        ) : (
          <Link
            href="/ia#pricing"
            className="inline-flex min-h-[48px] items-center justify-center rounded-2xl bg-brand-orange px-6 py-3 text-sm font-black text-white shadow-lg shadow-orange-900/30 transition hover:bg-orange-500"
          >
            Ver planes
          </Link>
        )}
        {loggedIn ? (
          <Link
            href="/mi-radar"
            className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-white/25 bg-white/5 px-6 py-3 text-sm font-bold text-white backdrop-blur transition hover:bg-white/10"
          >
            Mi radar
          </Link>
        ) : (
          <Link
            href="/login"
            className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-white/25 bg-white/5 px-6 py-3 text-sm font-bold text-white backdrop-blur transition hover:bg-white/10"
          >
            Iniciar sesión
          </Link>
        )}
      </div>
    </div>
  );
}

function RadarStripPill({
  label,
  value,
  accent = "slate",
}: {
  label: string;
  value: string;
  accent?: "slate" | "orange" | "navy";
}) {
  const ring =
    accent === "orange"
      ? "border-amber-200/90 bg-amber-50/90 text-amber-950"
      : accent === "navy"
        ? "border-brand-navy/15 bg-brand-navy/[0.06] text-brand-navy"
        : "border-slate-200 bg-white text-slate-800";
  return (
    <div className={`rounded-2xl border px-3 py-2 text-left shadow-sm ${ring}`}>
      <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-0.5 text-sm font-bold leading-snug">{value}</p>
    </div>
  );
}

export function TrendDetailArticle({
  trend: t,
  access,
  user = null,
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
          <RadarMembershipCard user={user ?? null} />
        </div>
        <p className="mt-10 text-center">
          <Link href={backFooter.href} className="text-sm font-bold text-brand-orange hover:underline">
            {backFooter.label}
          </Link>
        </p>
      </article>
    );
  }

  const radarPayload = parseRadarPayload(t);
  const oppLevel = deriveOpportunityLevel(t.trendScore, radarPayload.opportunity_level);
  const urgency = deriveUrgency(t.trendScore, t.signalPostedAt, radarPayload.urgency);
  const audience = deriveAudienceLabels(t, radarPayload.audience);
  const actionsToday = deriveActionsToday(t, radarPayload.actions_today);
  const contentIdeas = clampIdeasList(t.contentIdeas as string[] | null, 3, 5);
  const businessIdeas = clampIdeasList(t.businessIdeas as string[] | null, 3, 5);
  const tags = (t.tags as string[] | null)?.filter(Boolean) ?? [];
  const radarTs = trendRadarInstant(t);
  const readMin = estimateReadingMinutes(t);
  const audienceShort =
    audience.length <= 3 ? audience.join(" · ") : `${audience.slice(0, 2).join(" · ")} +${audience.length - 2}`;

  return (
    <article className="mx-auto max-w-3xl px-4 py-10 md:py-14">
      {/* Hero */}
      <header className="border-b border-slate-200/90 pb-10">
        <div className="flex flex-col gap-5 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
            <span className="rounded-full bg-brand-navy px-3 py-1 text-[11px] font-black uppercase tracking-wider text-white">
              {categoryDisplayName(t.categorySlug)}
            </span>
            <TrendScoreBadge score={t.trendScore} size="lg" />
            <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
              <Clock className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
              <time dateTime={radarTs.toISOString()} className="font-semibold">
                {radarTs.toLocaleString("es-MX", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </time>
            </span>
          </div>
          {saveButton ? <div className="shrink-0 sm:ml-auto">{saveButton}</div> : null}
        </div>

        <h1 className="mt-7 text-3xl font-black leading-[1.12] tracking-tight text-brand-navy md:text-4xl lg:text-[2.65rem]">
          {t.title}
        </h1>

        <p className="mt-5 text-lg leading-relaxed text-slate-700 line-clamp-3 md:text-xl">{t.summary}</p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <RadarStripPill label="Nivel de oportunidad" value={opportunityLevelLabel(oppLevel)} accent="orange" />
          <RadarStripPill label="Urgencia" value={urgencyLabel(urgency)} accent="navy" />
          <RadarStripPill label="Ideal para" value={audienceShort} accent="slate" />
          <RadarStripPill label="Lectura estimada" value={`~ ${readMin} min`} accent="slate" />
        </div>
      </header>

      {/* Qué pasó */}
      <section className="mt-12">
        <div className="flex items-center gap-2">
          <Radar className="h-5 w-5 text-brand-orange" aria-hidden />
          <h2 className="text-xs font-black uppercase tracking-[0.22em] text-brand-navy">Qué pasó</h2>
        </div>
        <p className="mt-4 text-base leading-relaxed text-slate-800 md:text-lg">{t.summary}</p>
      </section>

      {/* Por qué importa */}
      {t.whyItMatters ? (
        <section className="mt-12 rounded-[1.75rem] border-l-[6px] border-brand-navy bg-slate-50/90 px-6 py-7 md:px-8 md:py-9">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-brand-navy" aria-hidden />
            <h2 className="text-lg font-black text-brand-navy md:text-xl">Por qué importa</h2>
          </div>
          <p className="mt-4 text-base leading-relaxed text-slate-700 md:text-[1.05rem]">{t.whyItMatters}</p>
        </section>
      ) : null}

      {/* Oportunidad */}
      {t.opportunity ? (
        <section className="mt-10 rounded-[1.75rem] border border-brand-orange/25 bg-gradient-to-br from-amber-50/95 via-white to-white px-6 py-7 shadow-soft md:px-8 md:py-9">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-brand-orange" aria-hidden />
            <h2 className="text-lg font-black tracking-tight text-brand-navy md:text-xl">Oportunidad</h2>
          </div>
          <p className="mt-4 text-base leading-relaxed text-slate-800 md:text-[1.05rem]">{t.opportunity}</p>
        </section>
      ) : null}

      {/* Cómo aprovecharlo hoy */}
      <section className="mt-12">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-brand-orange" aria-hidden />
          <h2 className="text-lg font-black text-brand-navy md:text-xl">Cómo aprovecharlo hoy</h2>
        </div>
        <p className="mt-2 text-sm text-slate-600">Tres pasos prácticos para esta semana.</p>
        <ul className="mt-5 space-y-3">
          {actionsToday.map((line) => (
            <li
              key={line}
              className="flex gap-3 rounded-2xl border border-slate-200/90 bg-white px-4 py-3.5 shadow-sm"
            >
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-orange" aria-hidden />
              <span className="text-sm font-semibold leading-relaxed text-slate-800 md:text-base">{line}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Ideas de contenido */}
      {contentIdeas.length > 0 ? (
        <section className="mt-14">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-brand-orange" aria-hidden />
            <h2 className="text-xl font-black text-brand-navy md:text-2xl">Ideas de contenido</h2>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-1">
            {contentIdeas.map((idea) => (
              <div
                key={idea}
                className="rounded-2xl border border-slate-200/90 bg-white px-4 py-3.5 text-sm leading-relaxed text-slate-800 shadow-sm md:text-base"
              >
                <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-brand-orange align-middle" aria-hidden />
                {idea}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Ideas de negocio */}
      {businessIdeas.length > 0 ? (
        <section className="mt-14">
          <div className="flex items-center gap-2">
            <Bookmark className="h-5 w-5 text-brand-navy" aria-hidden />
            <h2 className="text-xl font-black text-brand-navy md:text-2xl">Ideas de negocio</h2>
          </div>
          <div className="mt-5 grid gap-3">
            {businessIdeas.map((idea) => (
              <div
                key={idea}
                className="rounded-2xl border border-brand-navy/10 bg-brand-navy/[0.03] px-4 py-3.5 text-sm leading-relaxed text-slate-800 shadow-sm md:text-base"
              >
                <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-brand-navy align-middle" aria-hidden />
                {idea}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Para quién aplica */}
      <section className="mt-14">
        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Para quién aplica</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {audience.map((label) => (
            <span
              key={label}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-brand-navy shadow-sm"
            >
              {label}
            </span>
          ))}
        </div>
      </section>

      {tags.length > 0 ? (
        <div className="mt-10 flex flex-wrap gap-2 border-t border-slate-100 pt-10">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600"
            >
              #{tag}
            </span>
          ))}
        </div>
      ) : null}

      {/* Fuente */}
      <section className="mt-12 rounded-2xl border border-slate-200 bg-slate-50/80 px-5 py-5 md:px-6 md:py-6">
        <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Fuente original</h2>
        <p className="mt-2 font-bold text-brand-navy">{t.sourceName ?? "—"}</p>
        {t.sourceUrl ? (
          <a
            href={t.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand-navy px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-slate-900"
          >
            Ver fuente original
            <ArrowUpRight className="h-4 w-4" aria-hidden />
          </a>
        ) : null}
      </section>

      {/* CTA */}
      <section className="mt-12 rounded-[1.75rem] border border-brand-navy/12 bg-gradient-to-br from-white to-slate-50 px-6 py-10 text-center shadow-soft md:px-10 md:py-12">
        <h2 className="text-xl font-black text-brand-navy md:text-2xl">Guarda esta señal en tu radar</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-600 md:text-base">
          Vuelve a consultarla cuando quieras o úsala para crear contenido, automatizaciones o ideas de negocio.
        </p>
        <Link
          href="/mi-radar"
          className="mt-6 inline-flex items-center justify-center rounded-full bg-brand-orange px-8 py-3 text-sm font-black text-white shadow-lg shadow-orange-500/25 transition hover:bg-orange-600"
        >
          Ir a Mi radar
        </Link>
      </section>

      {showNewsletter ? (
        <div className="mt-12">
          <NewsletterBox variant="complement" />
        </div>
      ) : null}

      <p className="mt-10 text-center">
        <Link href={backFooter.href} className="text-sm font-bold text-brand-orange hover:underline">
          {backFooter.label}
        </Link>
      </p>
    </article>
  );
}
