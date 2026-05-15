import { FREE_SECTION_PREVIEW_CHARS, FREE_SUMMARY_MAX_CHARS } from "./constants";

export function isPremiumPlan(plan: string | null | undefined): boolean {
  return plan === "premium";
}

export function truncateForFreeSummary(text: string, max = FREE_SUMMARY_MAX_CHARS): string {
  const t = text.trim();
  if (t.length <= max) return t;
  const slice = t.slice(0, max);
  const lastSpace = slice.lastIndexOf(" ");
  const base = lastSpace > max * 0.55 ? slice.slice(0, lastSpace) : slice;
  return `${base.trimEnd()}…`;
}

export function truncateSectionPreview(text: string, max = FREE_SECTION_PREVIEW_CHARS): string {
  const t = text.trim();
  if (t.length <= max) return t;
  const slice = t.slice(0, max);
  const lastSpace = slice.lastIndexOf(" ");
  const base = lastSpace > max * 0.45 ? slice.slice(0, lastSpace) : slice;
  return `${base.trimEnd()}…`;
}
