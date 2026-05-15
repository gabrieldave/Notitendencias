import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { subscribers, userPreferences, users } from "@/db/schema";
import { USER_SESSION_COOKIE_NAME } from "@/lib/constants";
import { authEmailLoginSchema } from "@/lib/schemas";
import { canSignUserSessions, signUserSession } from "@/lib/user-session";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido" }, { status: 400 });
  }

  const parsed = authEmailLoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Correo inválido" }, { status: 400 });
  }
  const email = parsed.data.email;

  if (!canSignUserSessions()) {
    return NextResponse.json(
      {
        ok: false,
        error: "Sesión no disponible: configura USER_SESSION_SECRET (mín. 16 caracteres).",
      },
      { status: 500 },
    );
  }

  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  let userId: string;
  if (existing) {
    userId = existing.id;
    await db
      .update(users)
      .set({ updatedAt: new Date() })
      .where(eq(users.id, existing.id));
    const [pref] = await db
      .select({ id: userPreferences.id })
      .from(userPreferences)
      .where(eq(userPreferences.userId, existing.id))
      .limit(1);
    if (!pref) {
      await db.insert(userPreferences).values({
        userId: existing.id,
        favoriteCategories: [],
        emailDigestFrequency: "weekly",
      });
    }
  } else {
    const [created] = await db
      .insert(users)
      .values({
        email,
        name: null,
        role: "user",
        plan: "free",
        status: "active",
      })
      .returning({ id: users.id });
    if (!created) {
      return NextResponse.json({ ok: false, error: "No se pudo crear el usuario" }, { status: 500 });
    }
    userId = created.id;
    await db.insert(userPreferences).values({
      userId,
      favoriteCategories: [],
      emailDigestFrequency: "weekly",
    });
  }

  const sessionToken = signUserSession(userId);

  const [u] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      plan: users.plan,
      status: users.status,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!u) {
    return NextResponse.json({ ok: false, error: "Usuario no encontrado" }, { status: 500 });
  }

  await db
    .insert(subscribers)
    .values({
      email: u.email,
      status: "active",
      plan: u.plan,
    })
    .onConflictDoUpdate({
      target: subscribers.email,
      set: { plan: u.plan, status: "active" },
    });

  const res = NextResponse.json({ ok: true, user: u });
  const secure = process.env.NODE_ENV === "production";
  res.cookies.set(USER_SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
