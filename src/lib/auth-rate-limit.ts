type Bucket = { count: number; resetAt: number };

const store = new Map<string, Bucket>();

const WINDOW_MS = 15 * 60 * 1000;
const MAX_PER_KEY = 12;

function prune(key: string, now: number): Bucket {
  const b = store.get(key);
  if (!b || b.resetAt <= now) {
    const fresh = { count: 0, resetAt: now + WINDOW_MS };
    store.set(key, fresh);
    return fresh;
  }
  return b;
}

/** Límite simple en memoria (proceso). Ajustar con Redis en multi-réplica. */
export function assertMagicLinkRateLimit(ipKey: string, emailKey: string): void {
  const now = Date.now();
  const bIp = prune(`ip:${ipKey}`, now);
  const bEmail = prune(`email:${emailKey}`, now);
  if (bIp.count >= MAX_PER_KEY) {
    throw new Error("Demasiados intentos desde esta red. Espera unos minutos.");
  }
  if (bEmail.count >= 5) {
    throw new Error("Demasiados enlaces a este correo. Espera unos minutos.");
  }
  bIp.count += 1;
  bEmail.count += 1;
}
