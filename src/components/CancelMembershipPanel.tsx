"use client";

import { useState } from "react";

type Props = {
  hasStripeCustomer: boolean;
  supportEmail?: string;
};

export function CancelMembershipPanel({
  hasStripeCustomer,
  supportEmail = "hola@notitendencias.com",
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function openBillingPortal() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/portal", {
        method: "POST",
        credentials: "same-origin",
      });
      const data = (await res.json()) as { ok?: boolean; url?: string; error?: string; code?: string };
      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      if (data.code === "no_stripe_customer") {
        setError(
          "Tu membresía no está vinculada a un cobro recurrente en Stripe (por ejemplo, si te la activó el equipo). Para cancelar, escríbenos.",
        );
        return;
      }
      setError(data.error ?? "No se pudo abrir el portal. Inténtalo más tarde.");
    } catch {
      setError("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-600">Cancelar membresía</p>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        {hasStripeCustomer
          ? "Puedes cancelar la renovación o gestionar el método de pago en el portal seguro de Stripe."
          : "Si pagaste con Stripe, usamos el mismo correo de tu cuenta para abrir el portal. Si no aparece, contacta a soporte."}
      </p>
      <button
        type="button"
        onClick={() => void openBillingPortal()}
        disabled={loading}
        className="mt-4 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50 disabled:opacity-60"
      >
        {loading ? "Abriendo portal…" : "Gestionar o cancelar en Stripe"}
      </button>
      {error ? (
        <p className="mt-3 text-xs leading-relaxed text-amber-900" role="alert">
          {error}{" "}
          <a href={`mailto:${supportEmail}`} className="font-semibold underline">
            {supportEmail}
          </a>
        </p>
      ) : (
        <p className="mt-3 text-xs text-slate-500">
          Tras cancelar en Stripe, tu plan volverá a gratuito cuando termine el periodo o al instante según tu
          suscripción. Dudas:{" "}
          <a href={`mailto:${supportEmail}`} className="font-semibold text-brand-navy underline">
            {supportEmail}
          </a>
        </p>
      )}
    </div>
  );
}