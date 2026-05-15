import { notFound } from "next/navigation";
import { db } from "@/db";
import { trends } from "@/db/schema";
import { eq } from "drizzle-orm";
import { TrendDetailArticle } from "@/components/TrendDetailArticle";
import { AdminPreviewToolbar } from "@/components/AdminPreviewToolbar";
import { trendMentionsArxiv } from "@/lib/editorial";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  try {
    const { slug } = await params;
    const [t] = await db.select().from(trends).where(eq(trends.slug, slug)).limit(1);
    if (!t) return { title: "Vista previa · Notitendencias", robots: { index: false, follow: false } };
    return {
      title: `Vista previa: ${t.title} · Notitendencias`,
      description: t.summary.slice(0, 160),
      robots: { index: false, follow: false },
    };
  } catch {
    return { title: "Notitendencias", robots: { index: false, follow: false } };
  }
}

export default async function AdminPreviewTrendPage({ params }: Props) {
  const { slug } = await params;
  const [t] = await db.select().from(trends).where(eq(trends.slug, slug)).limit(1);
  if (!t) notFound();

  const unpublished = t.status !== "published";
  const bannerText = unpublished
    ? "Vista previa admin: esta tendencia todavía no está publicada."
    : "Vista previa admin: esta tendencia ya está publicada.";
  const mentionsArxiv = trendMentionsArxiv(t);

  return (
    <>
      <div className="sticky top-0 z-30 border-b border-amber-200 bg-amber-50 shadow-sm">
        <p className="px-4 py-2.5 text-center text-sm font-semibold text-amber-950">{bannerText}</p>
        <AdminPreviewToolbar trendId={t.id} slug={t.slug} status={t.status} mentionsArxiv={mentionsArxiv} />
      </div>
      <TrendDetailArticle
        trend={t}
        access="full"
        backFooter={{ href: "/admin", label: "← Volver al panel admin" }}
      />
    </>
  );
}
