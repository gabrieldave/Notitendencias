import { db } from "@/db";
import { trends, type Trend } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { CategoryNav } from "@/components/CategoryNav";
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
  const byScore = [...published].sort((a, b) => b.trendScore - a.trendScore);
  const mostViewed = byScore.slice(0, 5);
  const momentum = byScore.slice(0, 6);
  const iaStories = published.filter((t) => t.categorySlug === "ia").slice(0, 4);
  const useIaBlock = iaStories.length > 0;
  const fallbackFeatured = byScore.slice(0, 3);

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
              {useIaBlock ? (
                <>
                  <SectionHeader
                    title="Historias destacadas de IA"
                    subtitle="Lo más reciente y relevante en inteligencia artificial."
                    action={{ href: "/ia", label: "Ver todas →" }}
                  />
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
              ) : (
                <>
                  <SectionHeader
                    title="Destacadas hoy"
                    subtitle="Las tendencias con mayor score editorial hasta que lleguen más historias de IA."
                    action={{ href: "/#categorias", label: "Explorar categorías →" }}
                  />
                  <div className="mt-6 grid gap-6 md:grid-cols-3">
                    {fallbackFeatured.length === 0 ? (
                      <p className="text-slate-600 md:col-span-3">
                        Aún no hay tendencias publicadas. Conecta Kimi WebBridge o importa CSV desde el panel admin.
                      </p>
                    ) : (
                      fallbackFeatured.map((t) => <TrendCardLarge key={t.id} trend={t} />)
                    )}
                  </div>
                </>
              )}
            </div>

            <aside className="flex flex-col gap-6 lg:sticky lg:top-28 lg:self-start">
              <MostViewedSidebar trends={mostViewed} />
              <QuickSignalCard />
              <NewsletterBox variant="compact" />
            </aside>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 md:pb-20">
        <PremiumBanner />
      </section>

      <PricingSection />

      <section className="border-t border-slate-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14 md:py-16">
          <SectionHeader
            title="Tendencias que están marcando el cambio"
            subtitle="Alto score editorial: señales que concentramos para ti."
          />
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {momentum.length === 0 ? (
              <p className="text-slate-600 md:col-span-2">Pronto verás más señales aquí.</p>
            ) : (
              momentum.map((t) => <TrendCardLarge key={`mom-${t.id}`} trend={t} />)
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20">
        <NewsletterBox />
      </section>
    </div>
  );
}
