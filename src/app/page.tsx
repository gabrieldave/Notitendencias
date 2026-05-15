import { db } from "@/db";
import { trends, type Trend } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { CategoryNav } from "@/components/CategoryNav";
import { EditorialComingSoon } from "@/components/EditorialComingSoon";
import { HeroSection } from "@/components/HeroSection";
import { MostViewedSidebar } from "@/components/MostViewedSidebar";
import { NewsletterBox } from "@/components/NewsletterBox";
import { PremiumBanner } from "@/components/PremiumBanner";
import { PricingSection } from "@/components/PricingSection";
import { QuickSignalCard } from "@/components/QuickSignalCard";
import { SectionHeader } from "@/components/SectionHeader";
import { TrendCardHorizontal } from "@/components/TrendCardHorizontal";
import { TrendCardLarge } from "@/components/TrendCardLarge";

export const dynamic = "force-dynamic";

async function loadPublished(): Promise<Trend[]> {
  try {
    return await db
      .select()
      .from(trends)
      .where(eq(trends.status, "published"))
      .orderBy(desc(trends.publishedAt))
      .limit(80);
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const published = await loadPublished();
  const publishedCount = published.length;
  const byScore = [...published].sort((a, b) => b.trendScore - a.trendScore);
  const mostViewed = byScore.slice(0, 5);
  const momentum = byScore.slice(0, 6);
  const iaStories = published.filter((t) => t.categorySlug === "ia").slice(0, 4);
  const useIaBlock = iaStories.length > 0;
  const fallbackFeatured = byScore.slice(0, 3);
  const showMomentumSection = publishedCount >= 3;

  const fallbackGridClass =
    fallbackFeatured.length === 1
      ? "mt-6"
      : fallbackFeatured.length === 2
        ? "mt-6 grid gap-6 md:grid-cols-2"
        : "mt-6 grid gap-6 md:grid-cols-3";

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
          <div className="grid gap-10 lg:grid-cols-[1fr_360px] lg:gap-12">
            <div className="min-w-0 space-y-10">
              {publishedCount === 0 ? (
                <EditorialComingSoon />
              ) : useIaBlock ? (
                <>
                  <SectionHeader
                    title="Historias destacadas de IA"
                    subtitle="Lo más reciente y relevante en inteligencia artificial."
                    action={{ href: "/ia", label: "Ver todas →" }}
                  />
                  {iaStories.length === 1 && iaStories[0] ? (
                    <div className="mt-6">
                      <TrendCardHorizontal trend={iaStories[0]} featured />
                    </div>
                  ) : (
                    <>
                      {iaStories[0] && (
                        <div className="mt-6">
                          <TrendCardHorizontal trend={iaStories[0]} />
                        </div>
                      )}
                      <div className="mt-6 grid gap-6 sm:grid-cols-2">
                        {iaStories.slice(1, 4).map((t) => (
                          <TrendCardLarge key={t.id} trend={t} />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <>
                  <SectionHeader
                    title="Destacadas hoy"
                    subtitle="Las tendencias con mayor score editorial hasta que lleguen más historias de IA."
                    action={{ href: "/#categorias", label: "Explorar categorías →" }}
                  />
                  <div className={fallbackGridClass}>
                    {fallbackFeatured.length === 1 && fallbackFeatured[0] ? (
                      <TrendCardLarge trend={fallbackFeatured[0]} prominent />
                    ) : (
                      fallbackFeatured.map((t) => <TrendCardLarge key={t.id} trend={t} />)
                    )}
                  </div>
                </>
              )}
            </div>

            <aside className="flex flex-col gap-6 lg:sticky lg:top-28 lg:self-start">
              {mostViewed.length > 0 ? (
                <MostViewedSidebar trends={mostViewed} />
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/80 p-6 text-center text-sm text-slate-600">
                  <p className="font-semibold text-brand-navy">Próximamente</p>
                  <p className="mt-2 text-xs leading-relaxed">El ranking aparecerá cuando haya tendencias publicadas.</p>
                </div>
              )}
              <QuickSignalCard />
            </aside>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 md:pb-20">
        <PremiumBanner />
      </section>

      <PricingSection />

      {showMomentumSection && (
        <section className="border-t border-slate-100 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-14 md:py-16">
            <SectionHeader
              title="Tendencias que están marcando el cambio"
              subtitle="Alto score editorial: señales que concentramos para ti."
            />
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              {momentum.map((t) => (
                <TrendCardLarge key={`mom-${t.id}`} trend={t} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 pb-20 pt-4 md:pb-24">
        <div className="mx-auto max-w-4xl">
          <NewsletterBox />
        </div>
      </section>
    </div>
  );
}
