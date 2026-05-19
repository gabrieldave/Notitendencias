import { notFound } from "next/navigation";
import { db } from "@/db";
import { trends, userFavorites } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { RadarSidebar } from "@/components/RadarSidebar";
import { TrendDetailAccessSync } from "@/components/TrendDetailAccessSync";
import { TrendDetailArticle } from "@/components/TrendDetailArticle";
import { TrendSaveButton } from "@/components/TrendSaveButton";
import {
  loadRecentPublishedForSidebar,
  loadTopScoreTrends,
  pickTopScoreExcluding,
  pickTopTodayFromRecent,
} from "@/lib/radar-feed-queries";
import { isRadarContentUnlocked } from "@/lib/radar-access";
import { getOptionalSessionUser } from "@/lib/session-user";

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
    return {
      title: `${t.title} · Notitendencias`,
      description:
        "Señal en Notitendencias AI Radar. Activa la membresía para ver análisis, oportunidades e ideas de negocio.",
    };
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

  let topToday: Awaited<ReturnType<typeof pickTopTodayFromRecent>> = [];
  let topScore: Awaited<ReturnType<typeof pickTopScoreExcluding>> = [];

  try {
    const recent = await loadRecentPublishedForSidebar(40);
    topToday = pickTopTodayFromRecent(recent, 5);
    const scorePool = await loadTopScoreTrends(12);
    topScore = pickTopScoreExcluding(scorePool, new Set(topToday.map((x) => x.id)), 5);
  } catch {
    topToday = [];
    topScore = [];
  }

  const back = { href: "/ia", label: "← Radar IA" };

  const user = await getOptionalSessionUser();
  const radarUnlocked = isRadarContentUnlocked(user);
  const access = radarUnlocked ? "full" : "limited";

  let isFavorite = false;
  if (radarUnlocked && user) {
    const [fav] = await db
      .select({ id: userFavorites.id })
      .from(userFavorites)
      .where(and(eq(userFavorites.userId, user.id), eq(userFavorites.trendId, t.id)))
      .limit(1);
    isFavorite = Boolean(fav);
  }

  return (
    <div className="min-h-screen bg-slate-50/80">
      <TrendDetailAccessSync serverHasUser={Boolean(user)} />
      <div className="mx-auto max-w-7xl px-4 py-8 md:py-12">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-center lg:gap-12">
          <div className="mx-auto min-w-0 max-w-3xl flex-1 rounded-[2rem] border border-slate-100/80 bg-white shadow-soft lg:mx-0 lg:rounded-3xl">
            <TrendDetailArticle
              trend={t}
              access={access}
              user={user}
              backFooter={back}
              showNewsletter={radarUnlocked}
              saveButton={
                radarUnlocked && user ? (
                  <TrendSaveButton
                    trendId={t.id}
                    slug={t.slug}
                    initialSaved={isFavorite}
                    isLoggedIn
                    userPlan={user.plan}
                  />
                ) : null
              }
            />
          </div>
          <RadarSidebar topToday={topToday} topScore={topScore} titlesOnly={!radarUnlocked} />
        </div>
      </div>
    </div>
  );
}
