import { notFound } from "next/navigation";
import { db } from "@/db";
import { trends } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { TrendDetailArticle } from "@/components/TrendDetailArticle";

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

  return <TrendDetailArticle trend={t} />;
}
