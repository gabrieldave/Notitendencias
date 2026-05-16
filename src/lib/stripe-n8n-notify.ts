import type Stripe from "stripe";
import type { RadarFulfillResult } from "@/lib/stripe-premium-fulfill";

/** Compatible con tu gateway n8n: `appId`, `event`, `data`. */
export type N8nStripeRadarPayload = {
  appId: "notitendencias";
  event: "radar.payment_checkout";
  data: {
    /** Si la BD quedó en premium por este webhook */
    premiumActivated: boolean;
    /** Usuario Notitendencias afectado (si hubo match) */
    userId?: string | null;
    /** Si falló el match o el precio, por qué */
    fulfillReason?: string;
    fulfillMatch?: RadarFulfillResult["matchedVia"];
    stripeSessionId: string;
    stripeMode: string | null;
    customerEmail: string | null;
    clientReferenceId: string | null;
    amountTotal: number | null;
    currency: string | null;
    /** IDs price_* de la sesión (requiere STRIPE_SECRET_KEY en el servidor Next) */
    priceIds?: string[];
  };
};

async function loadPriceIdsFromStripe(sessionId: string): Promise<string[]> {
  const secret = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secret) return [];

  const StripeSdk = (await import("stripe")).default;
  const stripe = new StripeSdk(secret);
  const full = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["line_items.data.price"],
  });
  return (
    full.line_items?.data
      .map((li) => {
        const p = li.price;
        if (p && typeof p === "object" && "id" in p) return p.id;
        return null;
      })
      .filter((id): id is string => id != null) ?? []
  );
}

/**
 * Avisa a n8n tras procesar checkout.session.completed (Payment Link o Checkout API).
 * No lanza: errores solo en log; no debe tumbar el webhook de Stripe.
 */
export async function notifyN8nRadarPayment(
  session: {
    id: string;
    mode: Stripe.Checkout.Session["mode"];
    customer_details?: Stripe.Checkout.Session["customer_details"];
    customer_email?: string | null;
    client_reference_id?: string | null;
    amount_total?: number | null;
    currency?: string | null;
  },
  fulfill: RadarFulfillResult,
): Promise<void> {
  const url = process.env.N8N_PAYMENT_WEBHOOK_URL?.trim();
  if (!url) return;

  let priceIds: string[] = [];
  try {
    priceIds = await loadPriceIdsFromStripe(session.id);
  } catch (e) {
    console.warn("[stripe→n8n] no se pudieron cargar price ids:", e);
  }

  const customerEmail =
    session.customer_details?.email ?? session.customer_email ?? null;

  const body: N8nStripeRadarPayload = {
    appId: "notitendencias",
    event: "radar.payment_checkout",
    data: {
      premiumActivated: fulfill.ok,
      fulfillReason: fulfill.reason,
      fulfillMatch: fulfill.matchedVia,
      userId: fulfill.userId ?? null,
      stripeSessionId: session.id,
      stripeMode: session.mode,
      customerEmail,
      clientReferenceId: session.client_reference_id ?? null,
      amountTotal: session.amount_total ?? null,
      currency: session.currency ?? null,
      priceIds: priceIds.length ? priceIds : undefined,
    },
  };

  const secret = process.env.N8N_PAYMENT_WEBHOOK_SECRET?.trim();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (secret) headers.Authorization = `Bearer ${secret}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      console.warn("[stripe→n8n] respuesta no OK:", res.status, await res.text().catch(() => ""));
    }
  } catch (e) {
    console.warn("[stripe→n8n] fetch falló:", e);
  }
}
