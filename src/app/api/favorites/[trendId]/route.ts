import { NextResponse, type NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { userFavorites } from "@/db/schema";
import { isPremiumPlan } from "@/lib/membership";
import { getSessionPayloadFromRequest, getUserByIdForSession } from "@/lib/user-session";

type Params = Promise<{ trendId: string }>;

export async function DELETE(request: NextRequest, ctx: { params: Params }) {
  const payload = getSessionPayloadFromRequest(request);
  if (!payload) {
    return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
  }
  const user = await getUserByIdForSession(payload.sub);
  if (!user) {
    return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
  }
  if (!isPremiumPlan(user.plan)) {
    return NextResponse.json({ ok: false, error: "Solo plan Premium" }, { status: 403 });
  }

  const { trendId } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(trendId)) {
    return NextResponse.json({ ok: false, error: "ID inválido" }, { status: 400 });
  }

  await db
    .delete(userFavorites)
    .where(and(eq(userFavorites.userId, user.id), eq(userFavorites.trendId, trendId)));

  return NextResponse.json({ ok: true });
}
