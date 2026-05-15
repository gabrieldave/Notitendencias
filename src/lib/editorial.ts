/** Longitud a partir de la cual no mostramos el URL literal en UI pública/admin preview. */
export const SOURCE_URL_COLLAPSE_LENGTH = 64;

export const EDITORIAL_ARXIV_ALERT_ES =
  "Esta tendencia menciona arXiv. Revisión requerida según política editorial.";

const ARXIV_RE = /arxiv/i;

export function containsArxivReference(value: string | null | undefined): boolean {
  if (!value) return false;
  return ARXIV_RE.test(value);
}

function metadataToSearchString(meta: Record<string, unknown> | null | undefined): string {
  if (!meta || typeof meta !== "object") return "";
  try {
    return JSON.stringify(meta);
  } catch {
    return "";
  }
}

function joinStringList(value: unknown): string {
  if (!Array.isArray(value)) return "";
  return value.map((x) => String(x)).join("\n");
}

export function rawItemMentionsArxiv(item: {
  title: string;
  rawText: string | null;
  sourceUrl: string | null;
  metadataJson: Record<string, unknown> | null;
}): boolean {
  if (containsArxivReference(item.title)) return true;
  if (containsArxivReference(item.rawText)) return true;
  if (containsArxivReference(item.sourceUrl)) return true;
  if (containsArxivReference(metadataToSearchString(item.metadataJson))) return true;
  return false;
}

export function trendMentionsArxiv(trend: {
  title: string;
  summary: string;
  sourceUrl: string | null;
  sourceName: string | null;
  whyItMatters: string | null;
  opportunity: string | null;
  tags: unknown;
  contentIdeas: unknown;
  businessIdeas: unknown;
}): boolean {
  if (containsArxivReference(trend.title)) return true;
  if (containsArxivReference(trend.summary)) return true;
  if (containsArxivReference(trend.sourceUrl)) return true;
  if (containsArxivReference(trend.sourceName)) return true;
  if (containsArxivReference(trend.whyItMatters)) return true;
  if (containsArxivReference(trend.opportunity)) return true;
  if (containsArxivReference(joinStringList(trend.tags))) return true;
  if (containsArxivReference(joinStringList(trend.contentIdeas))) return true;
  if (containsArxivReference(joinStringList(trend.businessIdeas))) return true;
  return false;
}

export function mergeEditorialArxivMetadata(
  existing: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  const base =
    existing && typeof existing === "object" && !Array.isArray(existing)
      ? { ...existing }
      : {};
  const prev = base.editorial;
  const editorial: Record<string, unknown> =
    prev && typeof prev === "object" && !Array.isArray(prev)
      ? { ...(prev as Record<string, unknown>) }
      : {};
  editorial.arxiv_mentioned = true;
  base.editorial = editorial;
  return base;
}
