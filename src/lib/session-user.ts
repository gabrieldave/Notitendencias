import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq, gt } from "drizzle-orm";
import type { User } from "@/db/schema";
import { auth } from "@/auth";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import { isAdminEmail } from "@/lib/admin-emails";
import { isRadarContentUnlocked } from "@/lib/radar-access";
import { syncPremiumPlanFromSubscriber } from "@/lib/premium-sync";
import { isPremiumPlan } from "@/lib/membership";

export type PublicUser = Pick<User, "id" | "email" | "name" | "plan" | "status" | "role">;

const SESSION_COOKIE_NAMES = [
  "__Secure-authjs.session-token",
  "authjs.session-token",
  "__Secure-next-auth.session-token",
  "next-auth.session-token",
] as const;

async function rowToPublicUser(row: {
  id: string;
  email: string;
  name: string | null;
  role: string;
  plan: string;
  status: string;
}): Promise<PublicUser> {
  const plan = await syncPremiumPlanFromSubscriber(row.id, row.email);
  const role = row.role === "admin" || isAdminEmail(row.email) ? "admin" : row.role;
  return {
    id: row.id,
    email: row.email,
    name: row.name ?? null,
    plan,
    status: row.status,
    role,
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
  return rowToPublicUser(row);
}

/** Sesiones legacy (strategy database) guardadas en tabla `sessions`. */
async function loadUserFromDatabaseSessionCookie(): Promise<PublicUser | null> {
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
  return loadUserById(sess.userId);
}

/**
 * Única fuente de verdad de sesión en el servidor.
 * 1) JWT Auth.js  2) cookie de sesión en BD (legacy)
 */
export const getOptionalSessionUser = cache(async (): Promise<PublicUser | null> => {
  cookies();

  const session = await auth();
  const id = session?.user?.id;
  if (id) {
    const user = await loadUserById(id);
    if (user) return user;
  }

  return loadUserFromDatabaseSessionCookie();
});

export async function requireSessionUser(callbackPath = "/ia"): Promise<PublicUser> {
  const user = await getOptionalSessionUser();
  if (user) return user;
  redirect(`/login?callbackUrl=${encodeURIComponent(callbackPath)}`);
}

export async function requirePremiumUser(callbackPath = "/ia"): Promise<PublicUser> {
  const user = await requireSessionUser(callbackPath);
  if (isRadarContentUnlocked(user)) return user;
  redirect("/ia#pricing");
}

export function userHasPremium(user: PublicUser): boolean {
  return isPremiumPlan(user.plan) || user.role === "admin" || isAdminEmail(user.email);
}

export async function radarContentUnlockedFromAuth(): Promise<boolean> {
  const user = await getOptionalSessionUser();
  return isRadarContentUnlocked(user);
}
