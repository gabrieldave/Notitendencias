import Image from "next/image";
import Link from "next/link";

const explore = [{ href: "/ia", label: "Radar IA" }] as const;

const product = [
  { href: "/ia#newsletter", label: "Newsletter" },
  { href: "/ia#pricing", label: "AI Radar" },
  { href: "/mi-radar", label: "Mi radar" },
] as const;

const company = [
  { href: "mailto:hola@iareal.net", label: "Contacto" },
  { href: "https://iareal.net/privacidad", label: "Privacidad" },
  { href: "https://iareal.net/terminos", label: "Términos" },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-300/80 bg-gradient-to-b from-slate-100 to-slate-200/90">
      <div className="mx-auto max-w-7xl px-4 py-14 md:px-6 md:py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-5">
            <Link href="/ia" className="inline-flex flex-col gap-3 sm:flex-row sm:items-center">
              <Image
                src="/branding/logo-icon.png"
                alt=""
                width={56}
                height={56}
                className="h-14 w-14 rounded-2xl shadow-md ring-1 ring-slate-300/80"
              />
              <Image
                src="/branding/logo-wordmark.png"
                alt="Notitendencias"
                width={240}
                height={56}
                className="h-11 w-auto sm:h-12"
              />
            </Link>
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-slate-600 md:text-base">
              Señales de IA para México: tendencias claras, análisis accionable y radar premium sin ruido innecesario.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-7">
            <div>
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Explorar</h2>
              <ul className="mt-4 space-y-3">
                {explore.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm font-bold text-brand-navy hover:text-brand-orange md:text-base">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Producto</h2>
              <ul className="mt-4 space-y-3">
                {product.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm font-bold text-brand-navy hover:text-brand-orange md:text-base">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Empresa</h2>
              <ul className="mt-4 space-y-3">
                {company.map((l) => (
                  <li key={l.href}>
                    <a
                      href={l.href}
                      className="text-sm font-bold text-brand-navy hover:text-brand-orange md:text-base"
                      rel={l.href.startsWith("http") ? "noopener noreferrer" : undefined}
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <p className="mt-12 border-t border-slate-300/80 pt-8 text-center text-xs text-slate-500 md:text-left">
          © 2026 Notitendencias · iareal.net
        </p>
      </div>
    </footer>
  );
}
