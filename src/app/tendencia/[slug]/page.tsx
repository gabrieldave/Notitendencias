import { notFound } from "next/navigation";
import { db } from "@/db";
import { trends, type Trend } from "@/db/schema";
import { and, desc, eq, ne } from "drizzle-orm";
import { TrendDetailArticle } from "@/components/TrendDetailArticle";
import { MostViewedSidebar } from "@/components/MostViewedSidebar";
import { QuickSignalCard } from "@/components/QuickSignalCard";
import { NewsletterBox } from "@/components/NewsletterBox";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  try {
    const { slug } = await params;
    const [t] = await db
      .select()
      .from(trends)
      .where(and(eq(trends.slug, slug), eq(trends.status, "published")))
      .limit(1);
    if (!t) return { title: "Tendencia · Notitendencias" };
    return { title: `${t.title} · Notitendencias`, description: t.summary.slice(0, 160) };
  } catch {
    return { title: "Notitendencias" };
  }
}

export default async function TrendDetailPage({ params }: Props) {
  const { slug } = await params;
  const [t] = await db
    .select()
    .from(trends)
    .where(and(eq(trends.slug, slug), eq(trends.status, "published")))
    .limit(1);
  if (!t) notFound();

  let sidebarTrends: Trend[] = [];
  try {
    sidebarTrends = await db
      .select()
      .from(trends)
      .where(and(eq(trends.status, "published"), ne(trends.slug, slug)))
      .orderBy(desc(trends.trendScore))
      .limit(6);
  } catch {
    sidebarTrends = [];
  }

  const back =
    t.categorySlug === "ia"
      ? { href: "/ia", label: "← Más tendencias de IA" }
      : { href: `/categoria/${t.categorySlug}`, label: `← Más en ${t.categorySlug}` };

  return (
    <div className="min-h-screen bg-slate-50/80">
      <div className="mx-auto max-w-7xl px-4 py-8 md:py-12">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-12">
          <div className="min-w-0 rounded-[2rem] border border-slate-100/80 bg-white shadow-soft lg:rounded-3xl">
            <TrendDetailArticle trend={t} backFooter={back} showNewsletter={false} />
          </div>
          <aside className="flex flex-col gap-6 lg:sticky lg:top-28 lg:self-start">
            <MostViewedSidebar trends={sidebarTrends} />
            <QuickSignalCard />
            <NewsletterBox variant="compact" />
          </aside>
        </div>
      </div>
    </div>
  );
}
