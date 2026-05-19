import Link from "next/link";
import { Check } from "lucide-react";
import { PremiumMemberStrip } from "@/components/PremiumMemberStrip";
import { isRadarContentUnlocked } from "@/lib/radar-access";
import { getOptionalSessionUser } from "@/lib/session-user";
import { stripeRadarCheckoutUrl } from "@/lib/stripe-public";

const benefits = [
  "Acceso completo a todas las señales del radar",
  "Análisis accionables y contexto editorial",
  "Ideas de contenido y de negocio",
  "Radar diario de tendencias curadas",
  "Newsletter y resumen por correo",
  "Favoritos en Mi radar cuando tu cuenta esté activa",
  "Funciones completas de Mi radar al activar cobro",
] as const;

/** Referencia visual: donde Stripe suele cobrar con tarjetas habituales en la región (emoji como ícono). */
const REGION_ACCEPTED = [
  { iso: "MX", label: "México", flag: "🇲🇽" },
  { iso: "AR", label: "Argentina", flag: "🇦🇷" },
  { iso: "CO", label: "Colombia", flag: "🇨🇴" },
  { iso: "CL", label: "Chile", flag: "🇨🇱" },
  { iso: "PE", label: "Perú", flag: "🇵🇪" },
  { iso: "BR", label: "Brasil", flag: "🇧🇷" },
  { iso: "UY", label: "Uruguay", flag: "🇺🇾" },
  { iso: "EC", label: "Ecuador", flag: "🇪🇨" },
  { iso: "CR", label: "Costa Rica", flag: "🇨🇷" },
  { iso: "PA", label: "Panamá", flag: "🇵🇦" },
  { iso: "GT", label: "Guatemala", flag: "🇬🇹" },
  { iso: "DO", label: "Rep. Dominicana", flag: "🇩🇴" },
] as const;

export async function PricingSection() {
  const user = await getOptionalSessionUser();
  if (isRadarContentUnlocked(user)) {
    return <PremiumMemberStrip />;
  }
  const checkout = stripeRadarCheckoutUrl(user?.id ?? null);
  return (
    <section
      id="pricing"
      className="scroll-mt-28 w-full border-t border-slate-200 bg-gradient-to-b from-slate-50 via-white to-slate-50/80 py-16 md:py-20 lg:py-24"
    >
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <header className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-brand-orange">Membresía única</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-brand-navy md:text-4xl">
            Notitendencias AI Radar
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-600 md:text-lg">
            Radar accionable de IA para creadores, emprendedores y negocios pequeños.
          </p>
          <p className="mt-5 rounded-2xl border border-amber-100 bg-amber-50/90 px-4 py-3 text-sm font-semibold text-amber-950">
            {checkout
              ? "Checkout con Stripe. Tras pagar configura la URL de éxito hacia Mi radar (ej. …/mi-radar?bienvenida=1). Para que el plan premium se active solo en tu cuenta hace falta un webhook de Stripe que actualice la BD (hoy también puedes asignar premium desde admin)."
              : "Precio beta. Configura NEXT_PUBLIC_STRIPE_RADAR_PAYMENT_LINK para activar el checkout. Mientras tanto puedes solicitar acceso por login."}
          </p>
        </header>

        <div className="mx-auto mt-12 max-w-lg rounded-3xl border-2 border-brand-orange bg-gradient-to-b from-brand-navy via-brand-navy to-slate-950 p-8 text-white shadow-lift sm:p-10">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-white/15 pb-6">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-200/95">Mensual</p>
              <p className="mt-2 flex flex-wrap items-baseline gap-2 font-black tabular-nums tracking-tight">
                <span className="text-5xl md:text-6xl">$5</span>
                <span className="text-xl font-bold text-white/90 md:text-2xl">USD / mes</span>
              </p>
              <p className="mt-2 text-xs font-medium leading-snug text-white/65">
                Cobro en USD con Stripe. Equivalente orientativo en pesos según tu banco y tipo de cambio.
              </p>
            </div>
            <p className="shrink-0 rounded-xl bg-white/10 px-3 py-2 text-center text-xs font-semibold leading-tight text-white/90 ring-1 ring-white/15">
              ~ $99 MXN / mes
            </p>
          </div>

          <div className="mt-6">
            <p className="text-center text-[10px] font-black uppercase tracking-[0.18em] text-amber-200/90">
              Pagos desde Latinoamérica
            </p>
            <div
              className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:gap-2.5"
              role="list"
              aria-label="Países de Latinoamérica desde los que puedes suscribirte"
            >
              {REGION_ACCEPTED.map((c) => (
                <span
                  key={c.iso}
                  role="listitem"
                  title={c.label}
                  aria-label={c.label}
                  className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-[1.35rem] leading-none shadow-inner shadow-black/20 ring-1 ring-white/20 transition hover:bg-white/15 sm:h-12 sm:w-12 sm:text-[1.5rem]"
                >
                  <span aria-hidden>{c.flag}</span>
                </span>
              ))}
            </div>
          </div>

          <ul className="mt-8 flex flex-col gap-3.5 text-sm leading-snug text-white/95 md:text-base">
            {benefits.map((item) => (
              <li key={item} className="flex gap-3">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-brand-orange" strokeWidth={2.5} aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <div className="mt-10 flex flex-col gap-3">
            {checkout ? (
              <a
                href={checkout}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-[52px] w-full items-center justify-center rounded-2xl bg-brand-orange px-6 py-3.5 text-base font-black text-white shadow-lg shadow-orange-900/25 transition hover:bg-orange-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-navy"
              >
                Pagar con Stripe
              </a>
            ) : user ? (
              <Link
                href="/mi-radar"
                className="flex min-h-[52px] w-full items-center justify-center rounded-2xl bg-brand-orange px-6 py-3.5 text-base font-black text-white shadow-lg shadow-orange-900/25 transition hover:bg-orange-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-navy"
              >
                Ir a Mi radar
              </Link>
            ) : (
              <Link
                href="/login?intent=premium"
                className="flex min-h-[52px] w-full items-center justify-center rounded-2xl bg-brand-orange px-6 py-3.5 text-base font-black text-white shadow-lg shadow-orange-900/25 transition hover:bg-orange-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-navy"
              >
                Unirme al radar
              </Link>
            )}
            <Link
              href="/ia#newsletter"
              className="text-center text-sm font-bold text-amber-100/95 underline decoration-dotted underline-offset-4 hover:text-white"
            >
              Recibir resumen por correo
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
