import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { trends, appEvents } from "@/db/schema";
import { isElevatedAdmin } from "@/lib/admin-auth";
import { EDITORIAL_ARXIV_ALERT_ES, trendMentionsArxiv } from "@/lib/editorial";
import { eq } from "drizzle-orm";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ segment: string }> },
) {
  if (!(await isElevatedAdmin())) {
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

  let confirmEditorialArxiv = false;
  const raw = await request.text();
  if (raw.trim()) {
    try {
      const parsed = JSON.parse(raw) as { confirmEditorialArxiv?: unknown };
      if (parsed.confirmEditorialArxiv === true) confirmEditorialArxiv = true;
    } catch {
      return NextResponse.json({ ok: false, error: "JSON del cuerpo inválido" }, { status: 400 });
    }
  }

  if (trendMentionsArxiv(trend) && !confirmEditorialArxiv) {
    return NextResponse.json(
      {
        ok: false,
        error: "EDITORIAL_ARXIV_CONFIRM_REQUIRED",
        message: EDITORIAL_ARXIV_ALERT_ES,
        hint: "Repite la solicitud POST con JSON: { \"confirmEditorialArxiv\": true } tras revisión manual explícita.",
      },
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

  return NextResponse.json({ ok: true, trend: updated });
}
