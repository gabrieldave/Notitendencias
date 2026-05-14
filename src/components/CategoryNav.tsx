import Link from "next/link";

const cats = [
  { slug: "ia", label: "IA" },
  { slug: "tecnologia", label: "Tecnología" },
  { slug: "dinero", label: "Dinero" },
  { slug: "creadores", label: "Creadores" },
  { slug: "entretenimiento", label: "Entretenimiento" },
  { slug: "negocios", label: "Negocios" },
];

export function CategoryNav() {
  return (
    <div id="categorias" className="scroll-mt-24">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Navegación por categoría
      </p>
      <div className="flex flex-wrap gap-2">
        {cats.map((c) => (
          <Link
            key={c.slug}
            href={c.slug === "ia" ? "/ia" : `/#cat-${c.slug}`}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-brand-navy shadow-sm transition hover:border-brand-orange hover:text-brand-orange"
          >
            {c.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
