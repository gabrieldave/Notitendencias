import { db } from "@/db";
import { trends, type Trend } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { CategoryNav } from "@/components/CategoryNav";
import { SectionHeader } from "@/components/SectionHeader";
import { TrendCardLarge } from "@/components/TrendCardLarge";
import { MostViewedSidebar } from "@/components/MostViewedSidebar";
import { QuickSignalCard } from "@/components/QuickSignalCard";
import { NewsletterBox } from "@/components/NewsletterBox";
import { PricingSection } from "@/components/PricingSection";
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

  let list: Trend[] = [];
  try {
    list = await db
      .select()
      .from(trends)
      .where(and(eq(trends.status, "published"), eq(trends.categorySlug, slug)))
      .orderBy(desc(trends.publishedAt))
      .limit(50);
  } catch {
    list = [];
  }

  const meta = titles[slug] ?? titles.ia;

  let topSidebar: Trend[] = [];
  try {
    topSidebar = await db
      .select()
      .from(trends)
      .where(eq(trends.status, "published"))
      .orderBy(desc(trends.trendScore))
      .limit(6);
  } catch {
    topSidebar = [];
  }

  return (
    <>
      <div className="border-b border-slate-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 md:py-10">
          <CategoryNav active={slug} />
        </div>
        <div className="mx-auto max-w-7xl px-4 pb-16">
          <header className="mb-10 max-w-3xl border-l-4 border-brand-orange pl-5 md:mb-12">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-brand-orange">Categoría</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-brand-navy md:text-5xl">{meta.h1}</h1>
            <p className="mt-4 text-lg text-slate-600">{meta.lead}</p>
          </header>

          <div className="grid gap-10 lg:grid-cols-[1fr_340px] lg:gap-12">
            <div>
              <SectionHeader title="Tendencias publicadas" subtitle="Ordenadas por fecha de publicación." />
              <div className="mt-8 grid gap-6 sm:grid-cols-2">
                {list.length === 0 ? (
                  <p className="text-slate-600 sm:col-span-2">Aún no hay tendencias publicadas en esta categoría.</p>
                ) : (
                  list.map((t) => <TrendCardLarge key={t.id} trend={t} />)
                )}
              </div>
            </div>
            <aside className="flex flex-col gap-6 lg:sticky lg:top-28 lg:self-start">
              <MostViewedSidebar trends={topSidebar} />
              <QuickSignalCard />
              <NewsletterBox variant="compact" />
            </aside>
          </div>
        </div>
      </div>

      <PricingSection />
    </>
  );
}
