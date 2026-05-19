import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { subscribers, users } from "@/db/schema";

/** Si el usuario pagó pero solo quedó premium en `subscribers`, sincroniza `users.plan`. */
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
