import { db } from "@/db";
import { trends, type Trend } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { CategoryNav } from "@/components/CategoryNav";
import { EditorialComingSoon } from "@/components/EditorialComingSoon";
import { MostViewedSidebar } from "@/components/MostViewedSidebar";
import { NewsletterBox } from "@/components/NewsletterBox";
import { PricingSection } from "@/components/PricingSection";
import { QuickSignalCard } from "@/components/QuickSignalCard";
import { SectionHeader } from "@/components/SectionHeader";
import { TrendCardLarge } from "@/components/TrendCardLarge";
import { Brain, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function IaPage() {
  let list: Trend[] = [];
  let topSidebar: Trend[] = [];
  try {
    list = await db
      .select()
      .from(trends)
      .where(and(eq(trends.status, "published"), eq(trends.categorySlug, "ia")))
      .orderBy(desc(trends.publishedAt))
      .limit(50);
    topSidebar = await db
      .select()
      .from(trends)
      .where(eq(trends.status, "published"))
      .orderBy(desc(trends.trendScore))
      .limit(6);
  } catch {
    list = [];
    topSidebar = [];
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
                Categoría · IA
              </p>
              <h1 className="mt-2 text-4xl font-black tracking-tight md:text-5xl">Inteligencia artificial</h1>
              <p className="mt-4 max-w-2xl text-lg text-white/85">
                Lanzamientos, modelos, agentes y señales prácticas para creadores y emprendedores en México.
              </p>
            </div>
          </div>
        </header>

        <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_360px] lg:gap-12">
          <div>
            <SectionHeader title="Todas las tendencias de IA" subtitle="Actualizadas por fecha de publicación." />
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              {list.length === 0 ? (
                <div className="sm:col-span-2">
                  <EditorialComingSoon />
                </div>
              ) : (
                list.map((t) => <TrendCardLarge key={t.id} trend={t} />)
              )}
            </div>
          </div>
          <aside className="flex flex-col gap-6 lg:sticky lg:top-28 lg:self-start">
            {topSidebar.length > 0 ? (
              <MostViewedSidebar trends={topSidebar} />
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-600">
                <p className="font-semibold text-brand-navy">Próximamente</p>
                <p className="mt-2 text-xs">Ranking cuando haya datos.</p>
              </div>
            )}
            <QuickSignalCard />
          </aside>
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
