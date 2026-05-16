import { auth } from "@/auth";
import type { Trend } from "@/db/schema";
import type { PublicUser } from "@/lib/session-user";
import { isPremiumPlan } from "@/lib/membership";

export function isRadarContentUnlocked(user: PublicUser | null): boolean {
  return Boolean(user && isPremiumPlan(user.plan));
}

export async function radarContentUnlockedFromAuth(): Promise<boolean> {
  const session = await auth();
  const u = session?.user;
  return Boolean(u?.id && u.status === "active" && isPremiumPlan(u.plan));
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
