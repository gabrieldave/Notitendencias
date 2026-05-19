import { eq } from "drizzle-orm";
import { db } from "@/db";
import { userFavorites } from "@/db/schema";

export async function loadFavoriteTrendIds(userId: string): Promise<Set<string>> {
  const rows = await db
    .select({ trendId: userFavorites.trendId })
    .from(userFavorites)
    .where(eq(userFavorites.userId, userId));
  return new Set(rows.map((r) => r.trendId));
}
