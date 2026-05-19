import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { subscribers } from "@/db/schema";

export async function isNewsletterEmailSubscribed(email: string): Promise<boolean> {
  const em = email.toLowerCase().trim();
  const [row] = await db
    .select({ id: subscribers.id })
    .from(subscribers)
    .where(sql`lower(${subscribers.email}) = ${em} and ${subscribers.status} = 'active'`)
    .limit(1);
  return Boolean(row);
}
