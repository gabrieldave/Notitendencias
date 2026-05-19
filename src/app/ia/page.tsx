import { EditorialComingSoon } from "@/components/EditorialComingSoon";
import { PremiumBanner } from "@/components/PremiumBanner";
import { NewsletterSection } from "@/components/NewsletterSection";
import { PricingSection } from "@/components/PricingSection";
import { RadarSidebar } from "@/components/RadarSidebar";
import { SectionHeader } from "@/components/SectionHeader";
import { TrendFeedCard } from "@/components/TrendFeedCard";
import { TrendSaveButton } from "@/components/TrendSaveButton";
import { loadFavoriteTrendIds } from "@/lib/user-favorites";
import {
  loadRecentPublishedForSidebar,
  loadTopScoreTrends,
  loadTrendFeed,
  pickTopScoreExcluding,
  pickTopTodayFromRecent,
} from "@/lib/radar-feed-queries";
import { isRadarContentUnlocked } from "@/lib/radar-access";
import { getOptionalSessionUser } from "@/lib/session-user";
import Link from "next/link";
import { Brain, Radio, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function IaPage() {
  const user = await getOptionalSessionUser();
  const radarUnlocked = isRadarContentUnlocked(user);
  const favoriteIds =
    radarUnlocked && user ? await loadFavoriteTrendIds(user.id) : new Set<string>();
  let list: Awaited<ReturnType<typeof loadTrendFeed>> = [];
  let topToday: Awaited<ReturnType<typeof pickTopTodayFromRecent>> = [];
  let topScore: Awaited<ReturnType<typeof pickTopScoreExcluding>> = [];

  try {
    list = await loadTrendFeed("ia", 50);
    const recent = await loadRecentPublishedForSidebar(40);
    topToday = pickTopTodayFromRecent(recent, 5);
    const scorePool = await loadTopScoreTrends(12);
    topScore = pickTopScoreExcluding(scorePool, new Set(topToday.map((t) => t.id)), 5);
  } catch {
    list = [];
    topToday = [];
    topScore = [];
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-200 via-slate-100 to-slate-50">
      <section className="relative overflow-hidden border-b border-brand-navy/30 bg-gradient-to-br from-brand-navy via-[#0d2647] to-slate-950 text-white">
        <div className="pointer-events-none absolute -right-24 top-0 h-72 w-72 rounded-full bg-brand-orange/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 bottom-0 h-56 w-56 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-[url('/branding/logo-icon.png')] bg-[length:420px] bg-right-top bg-no-repeat opacity-[0.04]" />

        <div className="relative mx-auto max-w-7xl px-4 py-12 md:py-16 lg:py-20">
          <div className="flex flex-wrap items-start gap-5">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 shadow-lift">
              <Brain className="h-9 w-9 text-brand-orange" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-amber-200/95">
                <Sparkles className="h-3.5 w-3.5 text-brand-orange" aria-hidden />
                Notitendencias · México
              </p>
              <h1 className="mt-4 text-4xl font-black tracking-tight md:text-5xl lg:text-[3.25rem]">
                Radar de{" "}
                <span className="bg-gradient-to-r from-brand-orange to-amber-300 bg-clip-text text-transparent">
                  inteligencia artificial
                </span>
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-300 md:text-xl">
                Lanzamientos, modelos, agentes y señales accionables — filtradas para creadores y equipos que no quieren
                perderse el cambio.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="#historias"
                  className="inline-flex items-center gap-2 rounded-full bg-brand-orange px-7 py-3.5 text-sm font-black text-white shadow-lg shadow-orange-900/40 transition hover:bg-orange-500"
                >
                  <Radio className="h-4 w-4" aria-hidden />
                  Ver señales
                </a>
                {!radarUnlocked && (
                  <a
                    href="#pricing"
                    className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/5 px-7 py-3.5 text-sm font-bold text-white transition hover:bg-white/10"
                  >
                    AI Radar Premium
                  </a>
                )}
                {radarUnlocked && user && (
                  <Link
                    href="/mi-radar"
                    className="inline-flex items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-500/15 px-7 py-3.5 text-sm font-bold text-emerald-100 transition hover:bg-emerald-500/25"
                  >
                    Mi radar · Premium activo
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {!radarUnlocked && (
        <section className="mx-auto max-w-7xl px-4 pb-2 pt-8 md:pt-10">
          <PremiumBanner />
        </section>
      )}

      <section id="historias" className="scroll-mt-24">
        <div className="mx-auto max-w-7xl px-4 py-12 md:py-16">
          <div className="flex flex-col gap-12 lg:flex-row lg:items-start lg:justify-center lg:gap-14">
            <div className="mx-auto w-full min-w-0 max-w-3xl flex-1 lg:mx-0">
              <SectionHeader
                title="Señales IA · en vivo"
                subtitle={
                  radarUnlocked
                    ? `${list.length} publicaciones · guarda favoritos con el icono y revísalos en Mi radar`
                    : `${list.length} titulares visibles · activa AI Radar para ver oportunidades e ideas`
                }
              />
              <div className="mt-10 flex flex-col gap-8 md:gap-10">
                {list.length === 0 ? (
                  <EditorialComingSoon />
                ) : (
                  list.map((t) => (
                    <TrendFeedCard
                      key={t.id}
                      trend={t}
                      titlesOnly={!radarUnlocked}
                      saveButton={
                        radarUnlocked && user ? (
                          <TrendSaveButton
                            trendId={t.id}
                            slug={t.slug}
                            initialSaved={favoriteIds.has(t.id)}
                            isLoggedIn
                            userPlan={user.plan}
                            variant="compact"
                          />
                        ) : undefined
                      }
                    />
                  ))
                )}
              </div>
            </div>
            <RadarSidebar
              topToday={topToday}
              topScore={topScore}
              titlesOnly={!radarUnlocked}
              hideUpsell={radarUnlocked}
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 md:pb-20">
        <div className="mx-auto max-w-4xl">
          <NewsletterSection />
        </div>
      </section>

      <PricingSection />
    </div>
  );
}
