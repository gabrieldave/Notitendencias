/** Etiquetas legibles para chips de categoría en feed y detalle. */
const LABELS: Record<string, string> = {
  ia: "Inteligencia artificial",
  tecnologia: "Tecnología",
  dinero: "Dinero",
  creadores: "Creadores",
  entretenimiento: "Entretenimiento",
  negocios: "Negocios",
};

export function categoryDisplayName(slug: string): string {
  return LABELS[slug] ?? slug.replace(/-/g, " ");
}
