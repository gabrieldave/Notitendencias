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
  ia: <Brain className="h-3.5 w-3.5" aria-hidden />,
  tecnologia: <Cpu className="h-3.5 w-3.5" aria-hidden />,
  dinero: <Coins className="h-3.5 w-3.5" aria-hidden />,
  creadores: <Users className="h-3.5 w-3.5" aria-hidden />,
  entretenimiento: <Clapperboard className="h-3.5 w-3.5" aria-hidden />,
  negocios: <TrendingUp className="h-3.5 w-3.5" aria-hidden />,
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
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Explorar por categoría</p>
        <Link
          href="/#categorias"
          className="hidden items-center gap-1 text-xs font-bold text-brand-orange hover:underline sm:inline-flex"
        >
          <LayoutGrid className="h-3.5 w-3.5" aria-hidden />
          Todas las categorías
        </Link>
      </div>
      <div className="-mx-1 flex gap-2 overflow-x-auto pb-1 scrollbar-hide px-1">
        <Link
          href="/"
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 ${
            active === "all"
              ? "bg-brand-orange text-white shadow-md shadow-orange-500/20"
              : "border border-slate-200 bg-white text-brand-navy hover:border-brand-orange/50 hover:bg-amber-50/50"
          }`}
        >
          <Sparkles className="h-3.5 w-3.5 opacity-90" aria-hidden />
          Todas
        </Link>
        {CATS.map((c) => {
          const isActive = active === c.slug;
          return (
            <Link
              key={c.slug}
              href={c.href}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 ${
                isActive
                  ? "bg-brand-navy text-white shadow-md"
                  : "border border-slate-200 bg-white text-brand-navy hover:border-brand-orange/50 hover:bg-amber-50/50"
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
