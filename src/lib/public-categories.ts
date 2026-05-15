/** Slugs de categoría con página pública `/categoria/[slug]` (alineado con seed). */
export const PUBLIC_CATEGORY_SLUGS = [
  "ia",
  "tecnologia",
  "dinero",
  "creadores",
  "entretenimiento",
  "negocios",
] as const;

export type PublicCategorySlug = (typeof PUBLIC_CATEGORY_SLUGS)[number];

export function isPublicCategorySlug(s: string): s is PublicCategorySlug {
  return (PUBLIC_CATEGORY_SLUGS as readonly string[]).includes(s);
}
