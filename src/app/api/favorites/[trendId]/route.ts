import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { userFavorites } from "@/db/schema";
import { requireApiPremiumUser } from "@/lib/api-auth";

type Props = { params: Promise<{ trendId: string }> };

export async function DELETE(_request: Request, { params }: Props) {
  const gate = await requireApiPremiumUser();
  if ("error" in gate) return gate.error;

  const { trendId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(trendId)) {
    return NextResponse.json({ ok: false, error: "ID inválido" }, { status: 400 });
  }

  await db
    .delete(userFavorites)
    .where(and(eq(userFavorites.userId, gate.user.id), eq(userFavorites.trendId, trendId)));

  return NextResponse.json({ ok: true });
}
