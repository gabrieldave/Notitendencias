import { db } from "@/db";
import { trends } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { CategoryNav } from "@/components/CategoryNav";
import { NewsletterBox } from "@/components/NewsletterBox";
import { PremiumPreview } from "@/components/PremiumPreview";
import { PricingTeaser } from "@/components/PricingTeaser";
import { TrendCard } from "@/components/TrendCard";

export const dynamic = "force-dynamic";

async function loadHomeTrends() {
  try {
    const published = await db
      .select()
      .from(trends)
      .where(eq(trends.status, "published"))
      .orderBy(desc(trends.publishedAt))
      .limit(12);
    const featured = [...published].sort((a, b) => b.trendScore - a.trendScore).slice(0, 3);
    const topViews = [...published].slice(0, 4);
    return { featured, topViews };
  } catch {
    return { featured: [], topViews: [] };
  }
}

export default async function HomePage() {
  const { featured, topViews } = await loadHomeTrends();

  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-white to-sky-50">
        <div className="pointer-events-none absolute -right-24 top-0 h-72 w-72 rounded-full bg-brand-orange/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-sky-300/30 blur-3xl" />
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-orange">
            Plataforma mexicana de tendencias digitales
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight text-brand-navy md:text-5xl">
            Las tendencias digitales más importantes, resumidas y convertidas en ideas útiles.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-slate-600">
            Rastreamos señales del internet, filtramos el ruido y te entregamos contenido claro,
            accionable y lleno de oportunidades.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href="/ia"
              className="rounded-full bg-brand-navy px-6 py-3 text-sm font-bold text-white shadow-lg hover:bg-brand-orange"
            >
              Ver tendencias de IA
            </a>
            <a
              href="#newsletter"
              className="rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-brand-navy hover:border-brand-orange"
            >
              Unirme al newsletter
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <CategoryNav />
      </section>

      <section className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-brand-navy">Destacadas hoy</h2>
            <p className="text-sm text-slate-600">Mayor score editorial reciente</p>
          </div>
          <a href="/ia" className="text-sm font-semibold text-brand-orange hover:underline">
            Ver categoría IA →
          </a>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {featured.length === 0 ? (
            <p className="text-slate-600 md:col-span-3">
              Aún no hay tendencias publicadas. Conecta Kimi WebBridge o importa CSV desde el
              panel admin.
            </p>
          ) : (
            featured.map((t) => <TrendCard key={t.id} trend={t} />)
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <h2 className="text-2xl font-bold text-brand-navy">Lo más visto</h2>
        <p className="text-sm text-slate-600">Orden editorial por frescura y score</p>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {topViews.length === 0
            ? null
            : topViews.map((t) => <TrendCard key={t.id} trend={t} />)}
        </div>
      </section>

      <section id="newsletter" className="mx-auto max-w-6xl px-4 py-12 scroll-mt-24">
        <NewsletterBox />
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <PremiumPreview />
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <PricingTeaser />
      </section>
    </div>
  );
}
