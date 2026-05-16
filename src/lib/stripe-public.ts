/**
 * Payment Link público de Stripe (NEXT_PUBLIC_*). Vacío → CTAs usan /#pricing o login.
 * Configura en Coolify el mismo enlace que en el dashboard de Stripe.
 */
export function stripeRadarPaymentLink(): string {
  return (process.env.NEXT_PUBLIC_STRIPE_RADAR_PAYMENT_LINK ?? "").trim();
}

/** Payment Link con `client_reference_id` para enlazar el cobro al usuario en el webhook (sesión iniciada). */
export function stripeRadarCheckoutUrl(userId?: string | null): string {
  const base = stripeRadarPaymentLink();
  if (!base) return "";
  try {
    const u = new URL(base);
    const id = userId?.trim();
    if (id) u.searchParams.set("client_reference_id", id);
    return u.toString();
  } catch {
    return base;
  }
}
