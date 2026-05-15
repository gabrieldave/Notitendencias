import { NextResponse, type NextRequest } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { trends, userFavorites } from "@/db/schema";
import { favoriteBodySchema } from "@/lib/schemas";
import { isPremiumPlan } from "@/lib/membership";
import { getSessionPayloadFromRequest, getUserByIdForSession } from "@/lib/user-session";

async function requirePremiumUser(request: NextRequest) {
  const payload = getSessionPayloadFromRequest(request);
  if (!payload) return { error: NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 }) };
  const user = await getUserByIdForSession(payload.sub);
  if (!user) return { error: NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 }) };
  if (!isPremiumPlan(user.plan)) {
    return { error: NextResponse.json({ ok: false, error: "Solo plan Premium" }, { status: 403 }) };
  }
  return { user };
}

export async function GET(request: NextRequest) {
  const gate = await requirePremiumUser(request);
  if ("error" in gate) return gate.error;

  const rows = await db
    .select({
      favoriteId: userFavorites.id,
      favoritedAt: userFavorites.createdAt,
      trend: trends,
    })
    .from(userFavorites)
    .innerJoin(trends, eq(userFavorites.trendId, trends.id))
    .where(
      and(eq(userFavorites.userId, gate.user.id), eq(trends.status, "published")),
    )
    .orderBy(desc(userFavorites.createdAt));

  return NextResponse.json({
    favorites: rows.map((r) => ({
      id: r.favoriteId,
      createdAt: r.favoritedAt,
      trend: r.trend,
    })),
  });
}

export async function POST(request: NextRequest) {
  const gate = await requirePremiumUser(request);
  if ("error" in gate) return gate.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido" }, { status: 400 });
  }

  const parsed = favoriteBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "trendId inválido" }, { status: 400 });
  }

  const [t] = await db
    .select({ id: trends.id })
    .from(trends)
    .where(and(eq(trends.id, parsed.data.trendId), eq(trends.status, "published")))
    .limit(1);
  if (!t) {
    return NextResponse.json({ ok: false, error: "Tendencia no disponible" }, { status: 404 });
  }

  await db
    .insert(userFavorites)
    .values({ userId: gate.user.id, trendId: t.id })
    .onConflictDoNothing({ target: [userFavorites.userId, userFavorites.trendId] });

  return NextResponse.json({ ok: true });
}
