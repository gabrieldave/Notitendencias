const MAX_WAIT_MS = 8000;

export async function postWebhook(
  url: string,
  body: unknown,
): Promise<{ ok: boolean; error?: string }> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), MAX_WAIT_MS);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      return { ok: false, error: `HTTP ${res.status} ${txt.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error desconocido";
    return { ok: false, error: msg };
  } finally {
    clearTimeout(t);
  }
}

export function getWebhookUrl(
  key:
    | "N8N_WEBHOOK_PUBLISHED_TREND"
    | "N8N_WEBHOOK_NEWSLETTER"
    | "N8N_WEBHOOK_ALERTS",
): string | undefined {
  const v = process.env[key];
  return v && v.trim().length > 0 ? v.trim() : undefined;
}
