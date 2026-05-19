import { eq } from "drizzle-orm";
import type Stripe from "stripe";
import { db } from "@/db";
import { users } from "@/db/schema";
import { appBaseUrl, getStripeClient } from "@/lib/stripe-server";

export function stripeCustomerIdFromSession(session: Stripe.Checkout.Session): string | null {
  const c = session.customer;
  if (typeof c === "string" && c.startsWith("cus_")) return c;
  if (c && typeof c === "object" && "id" in c && typeof c.id === "string") return c.id;
  return null;
}

export async function persistStripeCustomerId(userId: string, customerId: string): Promise<void> {
  const id = customerId.trim();
  if (!id.startsWith("cus_")) return;
  await db
    .update(users)
    .set({ stripeCustomerId: id, updatedAt: new Date() })
    .where(eq(users.id, userId));
}

/** Resuelve `cus_…` desde BD o búsqueda por email en Stripe (y persiste en BD). */
export async function resolveStripeCustomerId(
  userId: string,
  email: string,
): Promise<{ customerId: string } | { error: "stripe_not_configured" | "no_stripe_customer" }> {
  const [row] = await db
    .select({ stripeCustomerId: users.stripeCustomerId })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const stored = row?.stripeCustomerId?.trim();
  if (stored?.startsWith("cus_")) return { customerId: stored };

  const stripe = getStripeClient();
  if (!stripe) return { error: "stripe_not_configured" };

  const list = await stripe.customers.list({ email: email.toLowerCase().trim(), limit: 1 });
  const found = list.data[0]?.id;
  if (!found?.startsWith("cus_")) return { error: "no_stripe_customer" };

  await persistStripeCustomerId(userId, found);
  return { customerId: found };
}

export async function createBillingPortalSession(
  customerId: string,
): Promise<{ url: string } | { error: "stripe_not_configured" | "portal_failed" }> {
  const stripe = getStripeClient();
  if (!stripe) return { error: "stripe_not_configured" };

  const returnUrl =
    process.env.STRIPE_CUSTOMER_PORTAL_RETURN_URL?.trim() ||
    `${appBaseUrl()}/mi-radar`;

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
    if (!session.url) return { error: "portal_failed" };
    return { url: session.url };
  } catch (e) {
    console.error("[stripe] billingPortal.sessions.create:", e);
    return { error: "portal_failed" };
  }
}

export async function downgradeUserByStripeCustomerId(customerId: string): Promise<boolean> {
  const [u] = await db
    .select({ id: users.id, email: users.email, plan: users.plan })
    .from(users)
    .where(eq(users.stripeCustomerId, customerId))
    .limit(1);
  if (!u || u.plan !== "premium") return false;

  const { downgradeUserPlan } = await import("@/lib/premium-downgrade");
  await downgradeUserPlan(u.id, u.email);
  return true;
}

/** Suscripción terminada o cancelada de forma definitiva. */
export function subscriptionShouldDowngrade(sub: Stripe.Subscription): boolean {
  return sub.status === "canceled" || sub.status === "unpaid" || sub.status === "incomplete_expired";
}
