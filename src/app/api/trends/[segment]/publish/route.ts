import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { trends, appEvents } from "@/db/schema";
import { isAdminFromRequest } from "@/lib/admin-auth";
import { getWebhookUrl, postWebhook } from "@/lib/webhook";
import { eq } from "drizzle-orm";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ segment: string }> },
) {
  if (!isAdminFromRequest(request)) {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
  }

  const { segment } = await ctx.params;
  if (!UUID_RE.test(segment)) {
    return NextResponse.json({ ok: false, error: "ID inválido" }, { status: 400 });
  }

  const [trend] = await db.select().from(trends).where(eq(trends.id, segment)).limit(1);
  if (!trend) {
    return NextResponse.json({ ok: false, error: "No encontrado" }, { status: 404 });
  }

  if (trend.status !== "draft" && trend.status !== "pending") {
    return NextResponse.json(
      { ok: false, error: `Estado no publicable: ${trend.status}` },
      { status: 400 },
    );
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

  const publishedUrl = getWebhookUrl("N8N_WEBHOOK_PUBLISHED_TREND");
  if (publishedUrl) {
    const r = await postWebhook(publishedUrl, { event: "trend.published", trend: updated });
    if (!r.ok) {
      console.warn("[n8n] published webhook:", r.error);
    }
  }

  if ((updated?.trendScore ?? 0) >= 80) {
    const alertUrl = getWebhookUrl("N8N_WEBHOOK_ALERTS");
    if (alertUrl) {
      const r = await postWebhook(alertUrl, {
        event: "trend.high_score",
        trend: updated,
      });
      if (!r.ok) {
        console.warn("[n8n] alert webhook:", r.error);
      }
    }
  }

  return NextResponse.json({ ok: true, trend: updated });
}
