import { CategoryNav } from "@/components/CategoryNav";
import { EditorialComingSoon } from "@/components/EditorialComingSoon";
import { HeroSection } from "@/components/HeroSection";
import { NewsletterBox } from "@/components/NewsletterBox";
import { PremiumBanner } from "@/components/PremiumBanner";
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

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let feed: Awaited<ReturnType<typeof loadTrendFeed>> = [];
  let topToday: Awaited<ReturnType<typeof pickTopTodayFromRecent>> = [];
  let topScore: Awaited<ReturnType<typeof pickTopScoreExcluding>> = [];

  try {
    feed = await loadTrendFeed(undefined, 40);
    const recent = await loadRecentPublishedForSidebar(40);
    topToday = pickTopTodayFromRecent(recent, 5);
    const scorePool = await loadTopScoreTrends(12);
    topScore = pickTopScoreExcluding(scorePool, new Set(topToday.map((t) => t.id)), 5);
  } catch {
    feed = [];
    topToday = [];
    topScore = [];
  }

  const publishedCount = feed.length;

  return (
    <div className="min-h-screen bg-slate-50/80">
      <HeroSection />

      <section className="border-b border-slate-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 md:py-10">
          <CategoryNav active="all" />
        </div>
      </section>

      <section id="historias" className="scroll-mt-28">
        <div className="mx-auto max-w-7xl px-4 py-12 md:py-16">
          <div className="flex flex-col gap-12 lg:flex-row lg:items-start lg:justify-center lg:gap-14">
            <div className="mx-auto w-full min-w-0 max-w-3xl flex-1 lg:mx-0">
              {publishedCount === 0 ? (
                <EditorialComingSoon />
              ) : (
                <>
                  <SectionHeader
                    title="Radar en vivo"
                    subtitle={`${publishedCount} señales recientes · todas las categorías · orden por fecha de publicación`}
                    action={{ href: "/ia", label: "Solo IA →" }}
                  />
                  <div className="mt-10 flex flex-col gap-8 md:gap-10">
                    {feed.map((t) => (
                      <TrendFeedCard key={t.id} trend={t} />
                    ))}
                  </div>
                </>
              )}
            </div>
            <RadarSidebar topToday={topToday} topScore={topScore} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 md:pb-20">
        <PremiumBanner />
      </section>

      <PricingSection />

      <section className="mx-auto max-w-7xl px-4 pb-20 pt-4 md:pb-24">
        <div className="mx-auto max-w-4xl">
          <NewsletterBox />
        </div>
      </section>
    </div>
  );
}
