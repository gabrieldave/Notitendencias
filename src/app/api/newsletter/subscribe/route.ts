import { NextResponse } from "next/server";
import { db } from "@/db";
import { subscribers } from "@/db/schema";
import { newsletterSubscribeSchema } from "@/lib/schemas";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido" }, { status: 400 });
  }

  const parsed = newsletterSubscribeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Email inválido", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const email = parsed.data.email.trim().toLowerCase();

  const existing = await db
    .select()
    .from(subscribers)
    .where(eq(subscribers.email, email))
    .limit(1);

  let sub = existing[0];
  if (!sub) {
    const [created] = await db
      .insert(subscribers)
      .values({ email, status: "active", plan: "free" })
      .onConflictDoNothing({ target: subscribers.email })
      .returning();
    if (created) {
      sub = created;
    } else {
      const again = await db
        .select()
        .from(subscribers)
        .where(eq(subscribers.email, email))
        .limit(1);
      sub = again[0]!;
    }
  }

  return NextResponse.json({ ok: true, subscriber: { id: sub.id, email: sub.email } });
}
