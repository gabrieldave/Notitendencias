import Link from "next/link";

const links = [
  { href: "/", label: "Inicio" },
  { href: "/ia", label: "IA" },
  { href: "/#categorias", label: "Categorías" },
  { href: "/admin", label: "Admin" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-lg font-bold text-brand-navy">
          Noti<span className="text-brand-orange">tendencias</span>
        </Link>
        <nav className="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-700">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-full px-3 py-1 transition hover:bg-amber-100 hover:text-brand-navy"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
