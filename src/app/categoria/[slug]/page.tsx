import { notFound } from "next/navigation";
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
import { isPublicCategorySlug } from "@/lib/public-categories";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

const titles: Record<string, { h1: string; lead: string }> = {
  ia: {
    h1: "Inteligencia artificial",
    lead: "Modelos, agentes y señales prácticas para creadores y equipos en México.",
  },
  tecnologia: {
    h1: "Tecnología",
    lead: "Innovación, herramientas y cambios que definen cómo construimos productos digitales.",
  },
  dinero: {
    h1: "Dinero",
    lead: "Finanzas personales, cripto, consumo y economía digital con contexto claro.",
  },
  creadores: {
    h1: "Creadores",
    lead: "Plataformas, formatos y monetización para quien vive del contenido.",
  },
  entretenimiento: {
    h1: "Entretenimiento",
    lead: "Cultura digital, streaming y tendencias de consumo que marcan conversación.",
  },
  negocios: {
    h1: "Negocios",
    lead: "Startups, GTM y modelos que están ganando tracción ahora.",
  },
};

export default async function CategoriaPage({ params }: Props) {
  const { slug } = await params;
  if (!isPublicCategorySlug(slug)) notFound();

  let list: Awaited<ReturnType<typeof loadTrendFeed>> = [];
  let topToday: Awaited<ReturnType<typeof pickTopTodayFromRecent>> = [];
  let topScore: Awaited<ReturnType<typeof pickTopScoreExcluding>> = [];

  try {
    list = await loadTrendFeed(slug, 50);
    const recent = await loadRecentPublishedForSidebar(40);
    topToday = pickTopTodayFromRecent(recent, 5);
    const scorePool = await loadTopScoreTrends(12);
    topScore = pickTopScoreExcluding(scorePool, new Set(topToday.map((t) => t.id)), 5);
  } catch {
    list = [];
    topToday = [];
    topScore = [];
  }

  const meta = titles[slug] ?? titles.ia;

  return (
    <>
      <div className="border-b border-slate-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 md:py-10">
          <CategoryNav active={slug} />
        </div>
        <div className="mx-auto max-w-7xl px-4 pb-16">
          <header className="mb-10 max-w-3xl border-l-4 border-brand-orange pl-5 md:mb-12">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-brand-orange">Radar · categoría</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-brand-navy md:text-5xl">{meta.h1}</h1>
            <p className="mt-4 text-lg text-slate-600">{meta.lead}</p>
          </header>

          <div className="flex flex-col gap-12 lg:flex-row lg:items-start lg:justify-center lg:gap-14">
            <div className="mx-auto w-full min-w-0 max-w-3xl flex-1 lg:mx-0">
              <SectionHeader
                title="Señales publicadas"
                subtitle="Feed cronológico por fecha del post en la fuente (cuando existe) o por publicación en el radar."
              />
              <div className="mt-10 flex flex-col gap-8 md:gap-10">
                {list.length === 0 ? (
                  <EditorialComingSoon />
                ) : (
                  list.map((t) => <TrendFeedCard key={t.id} trend={t} />)
                )}
              </div>
            </div>
            <RadarSidebar topToday={topToday} topScore={topScore} />
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-4 pb-16 md:pb-20">
        <div className="mx-auto max-w-4xl">
          <NewsletterBox />
        </div>
      </section>

      <PricingSection />
    </>
  );
}
