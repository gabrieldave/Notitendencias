import { NextResponse } from "next/server";
import { db } from "@/db";
import { trends } from "@/db/schema";
import { radarContentUnlockedFromAuth, trendToPublicApiJson } from "@/lib/radar-access";
import { trendPublicationSort } from "@/lib/radar-feed-queries";
import { and, eq, SQL } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const categorySlug = searchParams.get("category_slug");
  const unlocked = await radarContentUnlockedFromAuth();

  const parts: SQL[] = [eq(trends.status, "published")];
  if (categorySlug) {
    parts.push(eq(trends.categorySlug, categorySlug));
  }

  const rows = await db
    .select()
    .from(trends)
    .where(and(...parts))
    .orderBy(trendPublicationSort)
    .limit(100);

  return NextResponse.json({
    ok: true,
    radarUnlocked: unlocked,
    trends: rows.map((row) => trendToPublicApiJson(row, unlocked)),
  });
}
