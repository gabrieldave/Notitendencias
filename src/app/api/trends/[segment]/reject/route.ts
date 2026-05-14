import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { trends } from "@/db/schema";
import { isAdminFromRequest } from "@/lib/admin-auth";
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

  const now = new Date();
  const [updated] = await db
    .update(trends)
    .set({ status: "rejected", updatedAt: now })
    .where(eq(trends.id, trend.id))
    .returning();

  return NextResponse.json({ ok: true, trend: updated });
}
