import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api-auth";
import { isPremiumPlan } from "@/lib/membership";
import { createBillingPortalSession, resolveStripeCustomerId } from "@/lib/stripe-billing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Crea sesión del Customer Billing Portal de Stripe (gestionar / cancelar suscripción). */
export async function POST() {
  const gate = await requireApiUser();
  if ("error" in gate) return gate.error;

  const { user } = gate;
  if (!isPremiumPlan(user.plan)) {
    return NextResponse.json(
      { ok: false, error: "Solo disponible con membresía AI Radar activa.", code: "not_premium" },
      { status: 403 },
    );
  }

  const resolved = await resolveStripeCustomerId(user.id, user.email);
  if ("error" in resolved) {
    const message =
      resolved.error === "stripe_not_configured"
        ? "El portal de facturación no está configurado en el servidor."
        : "No encontramos un cobro de Stripe vinculado a tu cuenta. Si te dieron premium manualmente, contacta a soporte.";
    return NextResponse.json(
      { ok: false, error: message, code: resolved.error },
      { status: resolved.error === "no_stripe_customer" ? 404 : 503 },
    );
  }

  const portal = await createBillingPortalSession(resolved.customerId);
  if ("error" in portal) {
    return NextResponse.json(
      {
        ok: false,
        error: "No se pudo abrir el portal de Stripe. Inténtalo más tarde o escribe a soporte.",
        code: portal.error,
      },
      { status: 503 },
    );
  }

  return NextResponse.json({ ok: true, url: portal.url });
}
