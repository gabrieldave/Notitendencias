import Link from "next/link";
import { Mail, CheckCircle2 } from "lucide-react";
import { NewsletterBox } from "@/components/NewsletterBox";
import { isRadarContentUnlocked } from "@/lib/radar-access";
import { isNewsletterEmailSubscribed } from "@/lib/newsletter-subscriber";
import { getOptionalSessionUser } from "@/lib/session-user";

type Props = {
  variant?: "default" | "complement";
  className?: string;
};

/**
 * Newsletter según perfil:
 * - Premium + ya en lista → no molestar (detalle) o línea de confirmación (/ia)
 * - Premium sin lista → opt-in compacto
 * - Free/visitante → captación completa
 * - Free ya en lista → animar a AI Radar
 */
export async function NewsletterSection({ variant = "default", className = "" }: Props) {
  const user = await getOptionalSessionUser();
  const premium = isRadarContentUnlocked(user);
  const subscribed = user?.email ? await isNewsletterEmailSubscribed(user.email) : false;

  if (premium && subscribed) {
    if (variant === "complement") return null;
    return (
      <section
        id="newsletter"
        className={`scroll-mt-28 rounded-[2rem] border border-emerald-200/80 bg-emerald-50/50 px-6 py-8 text-center md:px-10 ${className}`}
      >
        <span className="inline-flex items-center gap-2 text-sm font-bold text-emerald-900">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden />
          Resumen semanal activo en <span className="text-brand-navy">{user!.email}</span>
        </span>
        <p className="mt-2 text-xs text-slate-600">
          Ya tienes AI Radar en la app; el correo es un extra cuando enviemos la edición.
        </p>
      </section>
    );
  }

  if (premium && !subscribed) {
    return (
      <NewsletterBox
        variant="complement"
        className={className}
        defaultEmail={user?.email ?? ""}
        title="Resumen semanal por correo"
        description="Opcional: recibe un digest de señales además de usar el radar en la web."
      />
    );
  }

  if (!premium && subscribed && user?.email) {
    return (
      <section
        id="newsletter"
        className={`scroll-mt-28 rounded-[2rem] border border-slate-200 bg-white px-6 py-10 text-center shadow-sm md:px-10 ${className}`}
      >
        <Mail className="mx-auto h-8 w-8 text-brand-orange" aria-hidden />
        <p className="mt-3 text-sm font-semibold text-slate-700">
          Ya estás en la lista del resumen semanal (<span className="text-brand-navy">{user.email}</span>).
        </p>
        <Link
          href="/ia#pricing"
          className="mt-5 inline-flex rounded-2xl bg-brand-orange px-6 py-3 text-sm font-black text-white shadow-md hover:bg-orange-600"
        >
          Desbloquear AI Radar completo
        </Link>
      </section>
    );
  }

  return (
    <NewsletterBox
      variant={variant}
      className={className}
      defaultEmail={user?.email ?? ""}
    />
  );
}
