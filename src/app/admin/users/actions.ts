"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { subscribers, users } from "@/db/schema";
import { isAdminFromCookies } from "@/lib/admin-auth";

export async function updateUserPlanAction(formData: FormData) {
  if (!(await isAdminFromCookies())) {
    redirect("/admin/login?next=/admin/users");
  }
  const userId = String(formData.get("userId") ?? "");
  const plan = String(formData.get("plan") ?? "");
  if (!userId || (plan !== "free" && plan !== "premium")) {
    return;
  }

  const [u] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!u) return;

  await db
    .update(users)
    .set({ plan, updatedAt: new Date() })
    .where(eq(users.id, userId));

  await db
    .update(subscribers)
    .set({ plan })
    .where(eq(subscribers.email, u.email));

  revalidatePath("/admin/users");
}
