import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { rawTrendItems, trends } from "@/db/schema";
import { processRawWithDeepSeek } from "@/lib/deepseek";
import { slugifyTitle } from "@/lib/slug";
import { isAdminFromRequest } from "@/lib/admin-auth";
import { eq } from "drizzle-orm";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!isAdminFromRequest(request)) {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
  }

  const { id } = await ctx.params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ ok: false, error: "ID inválido" }, { status: 400 });
  }

  const [raw] = await db.select().from(rawTrendItems).where(eq(rawTrendItems.id, id)).limit(1);
  if (!raw) {
    return NextResponse.json({ ok: false, error: "No encontrado" }, { status: 404 });
  }

  if (raw.status === "processed") {
    const existing = await db
      .select()
      .from(trends)
      .where(eq(trends.rawItemId, raw.id))
      .limit(1);
    if (existing[0]) {
      return NextResponse.json({ ok: true, trend: existing[0], reused: true });
    }
  }

  if (raw.status === "duplicate" || raw.status === "rejected") {
    return NextResponse.json(
      { ok: false, error: `No se puede procesar estado: ${raw.status}` },
      { status: 400 },
    );
  }

  try {
    const ds = await processRawWithDeepSeek({
      title: raw.title,
      rawText: raw.rawText,
      sourceName: raw.sourceName,
      sourceUrl: raw.sourceUrl,
      categorySlug: raw.categorySlug,
      metadata: raw.metadataJson,
    });

    const slug = slugifyTitle(ds.title);
    const now = new Date();

    const [trend] = await db
      .insert(trends)
      .values({
        rawItemId: raw.id,
        categorySlug: raw.categorySlug,
        title: ds.title,
        slug,
        summary: ds.summary,
        whyItMatters: ds.why_it_matters ?? null,
        opportunity: ds.opportunity ?? null,
        contentIdeas: ds.content_ideas ?? [],
        businessIdeas: ds.business_ideas ?? [],
        tags: ds.tags ?? [],
        trendScore: ds.trend_score,
        sourceUrl: raw.sourceUrl,
        sourceName: raw.sourceName,
        status: "pending",
      })
      .returning();

    await db
      .update(rawTrendItems)
      .set({ status: "processed", updatedAt: now })
      .where(eq(rawTrendItems.id, raw.id));

    return NextResponse.json({ ok: true, trend });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al procesar";
    await db
      .update(rawTrendItems)
      .set({ status: "error", updatedAt: new Date() })
      .where(eq(rawTrendItems.id, raw.id));
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
