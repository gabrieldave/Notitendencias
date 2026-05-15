import { eq } from "drizzle-orm";
import { db } from "@/db";
import { appEvents, rawTrendItems, trends, type Trend } from "@/db/schema";
import { processRawWithDeepSeek } from "@/lib/deepseek";
import { EDITORIAL_ARXIV_ALERT_ES, trendMentionsArxiv } from "@/lib/editorial";
import { slugifyTitle } from "@/lib/slug";

export const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type ProcessRawResult =
  | { ok: true; trend: Trend; reused?: boolean }
  | { ok: false; error: string; httpStatus: number };

export async function processRawItemById(rawId: string): Promise<ProcessRawResult> {
  if (!UUID_RE.test(rawId)) {
    return { ok: false, error: "ID inválido", httpStatus: 400 };
  }

  const [raw] = await db.select().from(rawTrendItems).where(eq(rawTrendItems.id, rawId)).limit(1);
  if (!raw) {
    return { ok: false, error: "No encontrado", httpStatus: 404 };
  }

  if (raw.status === "processed") {
    const existing = await db
      .select()
      .from(trends)
      .where(eq(trends.rawItemId, raw.id))
      .limit(1);
    if (existing[0]) {
      return { ok: true, trend: existing[0], reused: true };
    }
  }

  if (raw.status === "duplicate" || raw.status === "rejected") {
    return {
      ok: false,
      error: `No se puede procesar estado: ${raw.status}`,
      httpStatus: 400,
    };
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

    return { ok: true, trend: trend! };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al procesar";
    await db
      .update(rawTrendItems)
      .set({ status: "error", updatedAt: new Date() })
      .where(eq(rawTrendItems.id, raw.id));
    return { ok: false, error: msg, httpStatus: 500 };
  }
}

export type PublishTrendResult =
  | { ok: true; trend: Trend }
  | {
      ok: false;
      error: string;
      httpStatus: number;
      code?: string;
      message?: string;
      hint?: string;
    };

export async function publishTrendById(
  trendId: string,
  options: { confirmEditorialArxiv?: boolean } = {},
): Promise<PublishTrendResult> {
  if (!UUID_RE.test(trendId)) {
    return { ok: false, error: "ID inválido", httpStatus: 400 };
  }

  const [trend] = await db.select().from(trends).where(eq(trends.id, trendId)).limit(1);
  if (!trend) {
    return { ok: false, error: "No encontrado", httpStatus: 404 };
  }

  if (trend.status !== "draft" && trend.status !== "pending") {
    return {
      ok: false,
      error: `Estado no publicable: ${trend.status}`,
      httpStatus: 400,
    };
  }

  const confirmEditorialArxiv = options.confirmEditorialArxiv === true;

  if (trendMentionsArxiv(trend) && !confirmEditorialArxiv) {
    return {
      ok: false,
      error: "EDITORIAL_ARXIV_CONFIRM_REQUIRED",
      httpStatus: 400,
      code: "EDITORIAL_ARXIV_CONFIRM_REQUIRED",
      message: EDITORIAL_ARXIV_ALERT_ES,
      hint: 'Repite la solicitud POST con JSON: { "confirmEditorialArxiv": true } tras revisión manual explícita.',
    };
  }

  const now = new Date();
  const [updated] = await db
    .update(trends)
    .set({
      status: "published",
      publishedAt: now,
      updatedAt: now,
    })
    .where(eq(trends.id, trend.id))
    .returning();

  await db.insert(appEvents).values({
    type: "trend.published",
    payloadJson: { trendId: updated!.id, slug: updated!.slug, title: updated!.title },
    status: "new",
  });

  return { ok: true, trend: updated! };
}
