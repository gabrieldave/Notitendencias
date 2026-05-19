import { cookies } from "next/headers";
import { and, eq, gt } from "drizzle-orm";
import type { User } from "@/db/schema";
import { auth } from "@/auth";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import { syncPremiumPlanFromSubscriber } from "@/lib/radar-access";

export type PublicUser = Pick<User, "id" | "email" | "name" | "plan" | "status" | "role">;

const SESSION_COOKIE_NAMES = [
  "__Secure-authjs.session-token",
  "authjs.session-token",
  "__Secure-next-auth.session-token",
  "next-auth.session-token",
] as const;

/** Lee usuario activo desde cookie de sesión BD cuando `auth()` no devuelve `user.id`. */
async function loadUserFromDatabaseSession(): Promise<PublicUser | null> {
  const cookieStore = await cookies();
  let token: string | undefined;
  for (const name of SESSION_COOKIE_NAMES) {
    const v = cookieStore.get(name)?.value;
    if (v) {
      token = v;
      break;
    }
  }
  if (!token) return null;

  const now = new Date();
  const [sess] = await db
    .select({ userId: sessions.userId })
    .from(sessions)
    .where(and(eq(sessions.sessionToken, token), gt(sessions.expires, now)))
    .limit(1);
  if (!sess) return null;

  const [row] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      plan: users.plan,
      status: users.status,
    })
    .from(users)
    .where(eq(users.id, sess.userId))
    .limit(1);

  if (!row?.email || row.status !== "active") return null;

  const plan = await syncPremiumPlanFromSubscriber(row.id, row.email);
  return {
    id: row.id,
    email: row.email,
    name: row.name ?? null,
    plan,
    status: row.status,
    role: row.role,
  };
}

async function loadUserById(userId: string): Promise<PublicUser | null> {
  const [row] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      plan: users.plan,
      status: users.status,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!row?.email || row.status !== "active") return null;

  const plan = await syncPremiumPlanFromSubscriber(row.id, row.email);
  return {
    id: row.id,
    email: row.email,
    name: row.name ?? null,
    plan,
    status: row.status,
    role: row.role,
  };
}

export async function getOptionalSessionUser(): Promise<PublicUser | null> {
  cookies();

  const session = await auth();
  const u = session?.user;
  if (u?.id && u.email) {
    const fromId = await loadUserById(u.id);
    if (fromId) return fromId;
  }

  return loadUserFromDatabaseSession();
}
