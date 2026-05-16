/**
 * Payment Link público de Stripe (NEXT_PUBLIC_*). Vacío → CTAs usan /#pricing o login.
 * Configura en Coolify el mismo enlace que en el dashboard de Stripe.
 */
export function stripeRadarPaymentLink(): string {
  return (process.env.NEXT_PUBLIC_STRIPE_RADAR_PAYMENT_LINK ?? "").trim();
}
