import type Stripe from "stripe";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { appEvents, subscribers, users } from "@/db/schema";
import { persistStripeCustomerId, stripeCustomerIdFromSession } from "@/lib/stripe-billing";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function sessionMatchesAllowedPrices(sessionId: string): Promise<boolean> {
  const raw = process.env.STRIPE_PREMIUM_PRICE_IDS?.split(",").map((s) => s.trim()).filter(Boolean) ?? [];
  if (raw.length === 0) return true;

  const secret = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secret) {
    console.warn("[stripe] STRIPE_PREMIUM_PRICE_IDS definido pero falta STRIPE_SECRET_KEY; no se valida precio.");
    return true;
  }

  const StripeSdk = (await import("stripe")).default;
  const stripe = new StripeSdk(secret);
  const full = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["line_items.data.price"],
  });

  const priceIds =
    full.line_items?.data
      .map((li) => {
        const p = li.price;
        if (p && typeof p === "object" && "id" in p) return p.id;
        return null;
      })
      .filter(Boolean) ?? [];

  return priceIds.some((id) => raw.includes(id!));
}

async function upgradeUserPlan(
  userId: string,
  emailForSubscriber: string,
  stripeCustomerId?: string | null,
) {
  const now = new Date();
  await db.update(users).set({ plan: "premium", updatedAt: now }).where(eq(users.id, userId));
  await db.update(subscribers).set({ plan: "premium" }).where(eq(subscribers.email, emailForSubscriber));
  if (stripeCustomerId) await persistStripeCustomerId(userId, stripeCustomerId);
}

export type RadarFulfillResult = {
  ok: boolean;
  reason?: string;
  userId?: string;
  matchedVia?: "client_reference_id" | "email";
};

export async function fulfillRadarPremiumFromCheckoutSession(
  session: Stripe.Checkout.Session,
): Promise<RadarFulfillResult> {
  if (session.payment_status !== "paid") {
    return { ok: false, reason: "payment_not_paid" };
  }

  const priceOk = await sessionMatchesAllowedPrices(session.id);
  if (!priceOk) {
    return { ok: false, reason: "price_not_allowed" };
  }

  const stripeCustomerId = stripeCustomerIdFromSession(session);

  const clientRef = session.client_reference_id?.trim();
  if (clientRef && UUID_RE.test(clientRef)) {
    const [u] = await db.select().from(users).where(eq(users.id, clientRef)).limit(1);
    if (!u) return { ok: false, reason: "client_ref_user_not_found" };
    if (u.status !== "active") return { ok: false, reason: "client_ref_user_inactive" };
    await upgradeUserPlan(u.id, u.email, stripeCustomerId);
    await db.insert(appEvents).values({
      type: "stripe.checkout.completed",
      payloadJson: {
        sessionId: session.id,
        via: "client_reference_id",
        userId: u.id,
        mode: session.mode,
        stripeCustomerId,
      },
      status: "new",
    });
    return { ok: true, userId: u.id, matchedVia: "client_reference_id" };
  }

  const rawEmail = session.customer_details?.email ?? session.customer_email;
  if (!rawEmail?.trim()) return { ok: false, reason: "no_email" };
  const em = rawEmail.toLowerCase().trim();

  const [u] = await db.select().from(users).where(sql`lower(${users.email}) = ${em}`).limit(1);
  if (!u) return { ok: false, reason: "user_not_found" };
  if (u.status !== "active") return { ok: false, reason: "user_inactive" };

  await upgradeUserPlan(u.id, u.email, stripeCustomerId);
  await db.insert(appEvents).values({
    type: "stripe.checkout.completed",
    payloadJson: {
      sessionId: session.id,
      via: "email",
      email: em,
      userId: u.id,
      mode: session.mode,
      stripeCustomerId,
    },
    status: "new",
  });
  return { ok: true, userId: u.id, matchedVia: "email" };
}
