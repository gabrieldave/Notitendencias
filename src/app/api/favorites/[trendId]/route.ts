import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { userFavorites } from "@/db/schema";
import { isPremiumPlan } from "@/lib/membership";

type Params = Promise<{ trendId: string }>;

export async function DELETE(_request: Request, ctx: { params: Params }) {
  const session = await auth();
  const id = session?.user?.id;
  const plan = session?.user?.plan;
  const status = session?.user?.status;
  if (!id || status !== "active") {
    return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
  }
  if (!isPremiumPlan(plan ?? "free")) {
    return NextResponse.json({ ok: false, error: "Solo plan Premium" }, { status: 403 });
  }

  const { trendId } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(trendId)) {
    return NextResponse.json({ ok: false, error: "ID inválido" }, { status: 400 });
  }

  await db
    .delete(userFavorites)
    .where(and(eq(userFavorites.userId, id), eq(userFavorites.trendId, trendId)));

  return NextResponse.json({ ok: true });
}
