const WEBHOOK_TIMEOUT_MS = 12_000;

export type MagicLinkWebhookPayload = {
  to: string;
  name: string;
  verificationUrl: string;
  logoUrl: string;
};

/**
 * Envía el enlace mágico al gateway (n8n u otro) vía POST JSON.
 * No registrar la URL completa ni tokens en producción.
 */
export async function sendMagicLinkWebhook(payload: MagicLinkWebhookPayload): Promise<void> {
  const url = process.env.WEBHOOK_URL?.trim();
  const appId = process.env.APP_ID?.trim();
  if (!url || !appId) {
    throw new Error("WEBHOOK_URL o APP_ID no configurados");
  }

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        appId,
        event: "auth.magic_link",
        to: payload.to,
        data: {
          name: payload.name,
          verificationUrl: payload.verificationUrl,
          logoUrl: payload.logoUrl,
        },
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`Webhook respondió ${res.status}`);
    }
  } finally {
    clearTimeout(t);
  }
}
