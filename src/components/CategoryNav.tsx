import Link from "next/link";
import type { ReactNode } from "react";
import {
  Brain,
  Clapperboard,
  Coins,
  Cpu,
  LayoutGrid,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";

const ICONS: Record<string, ReactNode> = {
  ia: <Brain className="h-4 w-4" aria-hidden />,
  tecnologia: <Cpu className="h-4 w-4" aria-hidden />,
  dinero: <Coins className="h-4 w-4" aria-hidden />,
  creadores: <Users className="h-4 w-4" aria-hidden />,
  entretenimiento: <Clapperboard className="h-4 w-4" aria-hidden />,
  negocios: <TrendingUp className="h-4 w-4" aria-hidden />,
};

const CATS = [
  { slug: "ia", label: "IA", href: "/ia" as const },
  { slug: "tecnologia", label: "Tecnología", href: "/categoria/tecnologia" as const },
  { slug: "dinero", label: "Dinero", href: "/categoria/dinero" as const },
  { slug: "creadores", label: "Creadores", href: "/categoria/creadores" as const },
  { slug: "entretenimiento", label: "Entretenimiento", href: "/categoria/entretenimiento" as const },
  { slug: "negocios", label: "Negocios", href: "/categoria/negocios" as const },
] as const;

type Active = "all" | (typeof CATS)[number]["slug"];

type Props = {
  active?: Active;
  className?: string;
};

export function CategoryNav({ active = "all", className = "" }: Props) {
  return (
    <div id="categorias" className={`scroll-mt-28 ${className}`}>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Explorar por categoría</p>
        <Link
          href="/#categorias"
          className="inline-flex w-fit shrink-0 items-center justify-center gap-2 rounded-full border-2 border-brand-navy/15 bg-white px-4 py-2.5 text-sm font-black text-brand-navy shadow-sm transition hover:border-brand-orange hover:bg-amber-50/80 hover:text-brand-orange focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2"
        >
          <LayoutGrid className="h-4 w-4 text-brand-orange" aria-hidden />
          Todas las categorías
        </Link>
      </div>
      <div className="-mx-1 flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide px-1">
        <Link
          href="/"
          className={`inline-flex shrink-0 items-center gap-2 rounded-full px-5 py-3 text-base font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 ${
            active === "all"
              ? "bg-brand-orange text-white shadow-lg shadow-orange-500/25 ring-2 ring-brand-orange/40"
              : "border border-slate-200 bg-white text-brand-navy hover:border-brand-orange/60 hover:bg-amber-50/70 hover:shadow-md active:scale-[0.98]"
          }`}
        >
          <Sparkles className="h-4 w-4 opacity-90" aria-hidden />
          Todas
        </Link>
        {CATS.map((c) => {
          const isActive = active === c.slug;
          return (
            <Link
              key={c.slug}
              href={c.href}
              className={`inline-flex shrink-0 items-center gap-2 rounded-full px-5 py-3 text-base font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 ${
                isActive
                  ? "bg-brand-navy text-white shadow-lg shadow-brand-navy/25 ring-2 ring-brand-navy/30"
                  : "border border-slate-200 bg-white text-brand-navy hover:border-brand-orange/60 hover:bg-amber-50/70 hover:shadow-md active:scale-[0.98]"
              }`}
            >
              {ICONS[c.slug]}
              {c.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
