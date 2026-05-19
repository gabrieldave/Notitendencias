import { eq } from "drizzle-orm";
import { db } from "@/db";
import { subscribers, users } from "@/db/schema";

/** Baja plan premium en `users` y `subscribers` para el mismo correo. */
export async function downgradeUserPlan(userId: string, email: string): Promise<void> {
  const now = new Date();
  await db.update(users).set({ plan: "free", updatedAt: now }).where(eq(users.id, userId));
  await db.update(subscribers).set({ plan: "free" }).where(eq(subscribers.email, email));
}
