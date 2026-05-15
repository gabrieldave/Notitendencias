"use client";

import { useState } from "react";
import { Mail } from "lucide-react";

type Props = {
  variant?: "default" | "compact";
  className?: string;
};

export function NewsletterBox({ variant = "default", className = "" }: Props) {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error");
      setMsg("¡Listo! Revisa tu correo pronto.");
      setEmail("");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "No se pudo registrar");
    } finally {
      setLoading(false);
    }
  }

  const isCompact = variant === "compact";

  return (
    <div
      id="newsletter"
      className={`scroll-mt-28 rounded-3xl border border-slate-200/90 bg-gradient-to-br from-white via-white to-amber-50/50 shadow-soft ${isCompact ? "p-5" : "p-7 md:p-8"} ${className}`}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-navy text-white shadow-md">
          <Mail className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <h3 className={`font-black text-brand-navy ${isCompact ? "text-base" : "text-xl md:text-2xl"}`}>
            Recibe tendencias cada semana
          </h3>
          <p className={`mt-1 text-slate-600 ${isCompact ? "text-xs" : "text-sm"}`}>
            Resumen accionables, sin ruido ni copiar notas completas.
          </p>
        </div>
      </div>
      <form onSubmit={onSubmit} className={`mt-5 flex flex-col gap-3 ${isCompact ? "" : "sm:flex-row sm:items-stretch"}`}>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@correo.com"
          className="min-h-[48px] flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-brand-orange/30 transition focus:border-brand-orange/50 focus:ring-2"
        />
        <button
          type="submit"
          disabled={loading}
          className="min-h-[48px] shrink-0 rounded-2xl bg-brand-orange px-6 py-3 text-sm font-black text-white shadow-md shadow-orange-500/20 transition hover:bg-orange-600 disabled:opacity-60"
        >
          {loading ? "Enviando…" : "Suscribirme"}
        </button>
      </form>
      <p className="mt-3 text-xs font-medium text-slate-500">Sin spam. Cancela cuando quieras.</p>
      {msg && <p className="mt-3 text-sm font-medium text-brand-navy">{msg}</p>}
    </div>
  );
}
