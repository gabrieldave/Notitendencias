import type { RawTrendItem, Trend } from "@/db/schema";

function parseIsoDate(value: unknown): Date | null {
  if (typeof value !== "string") return null;
  const s = value.trim();
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Instantáneo del post en la fuente (p. ej. `x_created_at` en X), no el momento de ingestión en n8n.
 */
export function extractSignalPostedAtFromRaw(raw: RawTrendItem): Date | null {
  const meta = raw.metadataJson;
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return null;

  const candidates: unknown[] = [meta.x_created_at, meta.post_created_at, meta.created_at];
  for (const v of candidates) {
    const d = parseIsoDate(v);
    if (d) return d;
  }
  return null;
}

/**
 * Para orden y etiquetas del radar: hora del post original si existe; si no, publicación en sitio; si no, alta editorial.
 */
export function trendRadarInstant(t: Trend): Date {
  const signal = t.signalPostedAt;
  if (signal instanceof Date && !Number.isNaN(signal.getTime())) return signal;
  const pub = t.publishedAt;
  if (pub instanceof Date && !Number.isNaN(pub.getTime())) return pub;
  return t.createdAt;
}
