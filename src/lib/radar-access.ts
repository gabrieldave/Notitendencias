import type { Trend } from "@/db/schema";
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
