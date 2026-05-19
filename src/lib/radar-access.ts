import { eq, sql } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import type { Trend } from "@/db/schema";
import { subscribers, users } from "@/db/schema";
import { isAdminEmail } from "@/lib/admin-emails";
import type { PublicUser } from "@/lib/session-user";
import { isPremiumPlan } from "@/lib/membership";

/** Acceso editorial completo: plan premium, admin o correo en ADMIN_EMAILS. */
export function isRadarContentUnlocked(user: PublicUser | null): boolean {
  if (!user || user.status !== "active") return false;
  if (isPremiumPlan(user.plan)) return true;
  if (user.role === "admin") return true;
  if (isAdminEmail(user.email)) return true;
  return false;
}

export async function radarContentUnlockedFromAuth(): Promise<boolean> {
  const session = await auth();
  const u = session?.user;
  if (!u?.id || !u.email || u.status !== "active") return false;
  const plan = await syncPremiumPlanFromSubscriber(u.id, u.email);
  const user: PublicUser = {
    id: u.id,
    email: u.email,
    name: u.name ?? null,
    plan,
    status: u.status,
    role: u.role,
  };
  return isRadarContentUnlocked(user);
}

/**
 * Si el usuario pagó pero solo quedó premium en `subscribers`, sincroniza `users.plan`.
 * Útil cuando el webhook de Stripe falló o el pago fue antes de tener cuenta.
 */
export async function syncPremiumPlanFromSubscriber(userId: string, email: string): Promise<string> {
  const em = email.toLowerCase().trim();
  const [row] = await db
    .select({ plan: users.plan })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!row) return "free";
  if (row.plan === "premium") return "premium";

  const [sub] = await db
    .select({ plan: subscribers.plan })
    .from(subscribers)
    .where(sql`lower(${subscribers.email}) = ${em}`)
    .limit(1);

  if (sub?.plan === "premium") {
    await db.update(users).set({ plan: "premium", updatedAt: new Date() }).where(eq(users.id, userId));
    return "premium";
  }
  return row.plan;
}

/** Respuesta JSON pública sin premium: solo identificación y titular. */
export type TrendTeaserJson = Pick<Trend, "id" | "slug" | "title" | "categorySlug" | "status">;

export function trendToPublicApiJson(row: Trend, unlocked: boolean): Trend | TrendTeaserJson {
  if (unlocked) return row;
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    categorySlug: row.categorySlug,
    status: row.status,
  };
}
