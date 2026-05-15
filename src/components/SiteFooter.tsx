import Image from "next/image";
import Link from "next/link";

const links = [
  { href: "/", label: "Inicio" },
  { href: "/ia", label: "IA" },
  { href: "/#categorias", label: "Categorías" },
  { href: "/admin", label: "Admin" },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-14 md:py-16">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-md">
            <Link href="/" className="inline-flex items-center gap-2">
              <Image src="/branding/logo-icon.png" alt="" width={40} height={40} className="h-10 w-10 rounded-2xl" />
              <Image
                src="/branding/logo-wordmark.png"
                alt="Notitendencias"
                width={200}
                height={48}
                className="h-9 w-auto"
              />
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-slate-600">
              Señales útiles. Tendencias claras. Plataforma mexicana para entender el cambio digital sin perderse en el
              ruido.
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-10 gap-y-4" aria-label="Pie de página">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="text-sm font-bold text-brand-navy hover:text-brand-orange">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <p className="mt-12 border-t border-slate-100 pt-8 text-center text-xs text-slate-500 md:text-left">
          © {new Date().getFullYear()} Notitendencias · vibesystems.tech
        </p>
      </div>
    </footer>
  );
}
