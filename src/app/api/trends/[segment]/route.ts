import { NextResponse } from "next/server";
import { db } from "@/db";
import { trends } from "@/db/schema";
import { trendToPublicApiJson } from "@/lib/radar-access";
import { radarContentUnlockedFromAuth } from "@/lib/session-user";
import { and, eq } from "drizzle-orm";

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ segment: string }> },
) {
  const { segment } = await ctx.params;
  const unlocked = await radarContentUnlockedFromAuth();

  const [row] = await db
    .select()
    .from(trends)
    .where(and(eq(trends.slug, segment), eq(trends.status, "published")))
    .limit(1);

  if (!row) {
    return NextResponse.json({ ok: false, error: "No encontrado" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    radarUnlocked: unlocked,
    trend: trendToPublicApiJson(row, unlocked),
  });
}
