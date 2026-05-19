import Stripe from "stripe";

export function getStripeSecretKey(): string | null {
  return process.env.STRIPE_SECRET_KEY?.trim() || null;
}

export function getStripeClient(): Stripe | null {
  const secret = getStripeSecretKey();
  if (!secret) return null;
  return new Stripe(secret);
}

export function appBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.AUTH_URL?.trim() ||
    "http://localhost:3015"
  ).replace(/\/$/, "");
}
