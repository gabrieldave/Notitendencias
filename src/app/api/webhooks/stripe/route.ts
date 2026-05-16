import { headers } from "next/headers";
import Stripe from "stripe";
import { fulfillRadarPremiumFromCheckoutSession } from "@/lib/stripe-premium-fulfill";
import { notifyN8nRadarPayment } from "@/lib/stripe-n8n-notify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!webhookSecret) {
    console.error("[stripe] Falta STRIPE_WEBHOOK_SECRET");
    return new Response("Webhook no configurado", { status: 500 });
  }

  const body = await req.text();
  const sig = (await headers()).get("stripe-signature");
  if (!sig) {
    return new Response("Sin stripe-signature", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = Stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "firma inválida";
    console.warn("[stripe] constructEvent:", msg);
    return new Response(`Webhook Error: ${msg}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const result = await fulfillRadarPremiumFromCheckoutSession(session);
        if (!result.ok) {
          console.info("[stripe] checkout.session.completed sin upgrade:", result.reason, session.id);
        }
        await notifyN8nRadarPayment(session, result);
        break;
      }
      default:
        break;
    }
  } catch (e) {
    console.error("[stripe] handler:", e);
    return new Response("Error interno", { status: 500 });
  }

  return Response.json({ received: true });
}
