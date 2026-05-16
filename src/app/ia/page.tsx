import { CategoryNav } from "@/components/CategoryNav";
import { EditorialComingSoon } from "@/components/EditorialComingSoon";
import { NewsletterBox } from "@/components/NewsletterBox";
import { PricingSection } from "@/components/PricingSection";
import { RadarSidebar } from "@/components/RadarSidebar";
import { SectionHeader } from "@/components/SectionHeader";
import { TrendFeedCard } from "@/components/TrendFeedCard";
import {
  loadRecentPublishedForSidebar,
  loadTopScoreTrends,
  loadTrendFeed,
  pickTopScoreExcluding,
  pickTopTodayFromRecent,
} from "@/lib/radar-feed-queries";
import { isRadarContentUnlocked } from "@/lib/radar-access";
import { getOptionalSessionUser } from "@/lib/session-user";
import { Brain, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function IaPage() {
  const user = await getOptionalSessionUser();
  const radarUnlocked = isRadarContentUnlocked(user);
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
    <div className="min-h-screen bg-slate-50/80">
      <div className="border-b border-slate-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 md:py-10">
          <CategoryNav active="ia" />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 md:py-14">
        <header className="relative overflow-hidden rounded-[2rem] border border-slate-200/90 bg-gradient-to-br from-brand-navy via-brand-navy to-slate-950 px-6 py-10 text-white shadow-lift md:px-10 md:py-12">
          <div className="pointer-events-none absolute -right-16 top-0 h-48 w-48 rounded-full bg-brand-orange/25 blur-3xl" />
          <div className="relative flex flex-wrap items-start gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
              <Brain className="h-8 w-8 text-brand-orange" aria-hidden />
            </span>
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-amber-200/90">
                <Sparkles className="h-4 w-4" aria-hidden />
                Radar · IA
              </p>
              <h1 className="mt-2 text-4xl font-black tracking-tight md:text-5xl">Inteligencia artificial</h1>
              <p className="mt-4 max-w-2xl text-lg text-white/85">
                Feed cronológico de señales publicadas: lanzamientos, modelos y oportunidades accionables para creadores y
                equipos en México.
              </p>
            </div>
          </div>
        </header>

        <div className="mt-12 flex flex-col gap-12 lg:flex-row lg:items-start lg:justify-center lg:gap-14">
          <div className="mx-auto w-full min-w-0 max-w-3xl flex-1 lg:mx-0">
            <SectionHeader
              title="Radar IA · en vivo"
              subtitle={
                radarUnlocked
                  ? "Orden: más reciente primero según la fecha del post en la fuente cuando existe; si no, por publicación en el radar."
                  : "Solo titulares sin cuenta o sin AI Radar. Desbloquea la membresía para ver resumen, oportunidad e ideas."
              }
            />
            <div className="mt-10 flex flex-col gap-8 md:gap-10">
              {list.length === 0 ? (
                <EditorialComingSoon />
              ) : (
                list.map((t) => <TrendFeedCard key={t.id} trend={t} titlesOnly={!radarUnlocked} />)
              )}
            </div>
          </div>
          <RadarSidebar topToday={topToday} topScore={topScore} titlesOnly={!radarUnlocked} />
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-4 pb-16 md:pb-20">
        <div className="mx-auto max-w-4xl">
          <NewsletterBox />
        </div>
      </section>

      <PricingSection />
    </div>
  );
}
