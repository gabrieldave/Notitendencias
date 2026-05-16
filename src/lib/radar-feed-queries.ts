import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { trends, type Trend } from "@/db/schema";
import { calendarDayKeyForTrend } from "@/lib/feed-date";

/** Orden público del radar: fecha de publicación, o alta si no hubiera `published_at`. */
export const trendPublicationSort = desc(sql`coalesce(${trends.publishedAt}, ${trends.createdAt})`);

export async function loadTrendFeed(categorySlug?: string, limit = 50): Promise<Trend[]> {
  const cond =
    categorySlug !== undefined
      ? and(eq(trends.status, "published"), eq(trends.categorySlug, categorySlug))
      : eq(trends.status, "published");

  return db.select().from(trends).where(cond).orderBy(trendPublicationSort).limit(limit);
}

export async function loadTopScoreTrends(limit = 5): Promise<Trend[]> {
  return db
    .select()
    .from(trends)
    .where(eq(trends.status, "published"))
    .orderBy(desc(trends.trendScore))
    .limit(limit);
}

/** Recientes globales (para detectar “top de hoy” sin query extra por día). */
export async function loadRecentPublishedForSidebar(limit = 40): Promise<Trend[]> {
  return db
    .select()
    .from(trends)
    .where(eq(trends.status, "published"))
    .orderBy(trendPublicationSort)
    .limit(limit);
}

/** Top N publicadas “hoy” (calendario México), deduplicando por id. */
export function pickTopTodayFromRecent(recent: Trend[], limit = 5): Trend[] {
  const todayKey = calendarDayKeyForTrend(new Date());
  const seen = new Set<string>();
  const out: Trend[] = [];
  for (const t of recent) {
    const ts = t.publishedAt ?? t.createdAt;
    if (calendarDayKeyForTrend(ts) !== todayKey) continue;
    if (seen.has(t.id)) continue;
    seen.add(t.id);
    out.push(t);
    if (out.length >= limit) break;
  }
  return out;
}

/** Mayor score excluyendo ids ya mostrados en “hoy”. */
export function pickTopScoreExcluding(recentByScore: Trend[], excludeIds: Set<string>, limit = 5): Trend[] {
  const out: Trend[] = [];
  for (const t of recentByScore) {
    if (excludeIds.has(t.id)) continue;
    out.push(t);
    if (out.length >= limit) break;
  }
  return out;
}
