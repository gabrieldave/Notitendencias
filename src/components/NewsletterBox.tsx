"use client";

import { useState } from "react";
import { Mail, Sparkles } from "lucide-react";

type Props = {
  className?: string;
};

export function NewsletterBox({ className = "" }: Props) {
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

  return (
    <div
      id="newsletter"
      className={`relative scroll-mt-28 overflow-hidden rounded-[2rem] border border-slate-200/90 bg-gradient-to-br from-brand-navy via-brand-navy to-slate-950 p-8 text-white shadow-lift md:p-10 lg:p-12 ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(249,115,22,0.18),transparent_55%)]" />
      <div className="relative mx-auto max-w-3xl text-center">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
          <Mail className="h-7 w-7 text-brand-orange" aria-hidden />
        </span>
        <h3 className="mt-5 text-2xl font-black tracking-tight md:text-3xl lg:text-4xl">Recibe tendencias cada semana</h3>
        <p className="mt-3 text-base leading-relaxed text-white/85 md:text-lg">
          Resumen accionable, sin ruido y sin copiar notas completas.
        </p>
        <form onSubmit={onSubmit} className="mt-8 flex max-w-xl flex-col gap-3 sm:mx-auto sm:flex-row sm:items-stretch">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@correo.com"
            className="min-h-[52px] flex-1 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none backdrop-blur-sm ring-brand-orange/40 transition focus:border-brand-orange/60 focus:bg-white/15 focus:ring-2"
          />
          <button
            type="submit"
            disabled={loading}
            className="inline-flex min-h-[52px] shrink-0 items-center justify-center gap-2 rounded-2xl bg-brand-orange px-8 text-sm font-black text-white shadow-lg shadow-orange-900/30 transition hover:bg-orange-500 disabled:opacity-60"
          >
            <Sparkles className="h-4 w-4" aria-hidden />
            {loading ? "Enviando…" : "Suscribirme"}
          </button>
        </form>
        <p className="mt-4 text-xs font-medium text-white/50">Sin spam. Cancela cuando quieras.</p>
        {msg && <p className="mt-4 text-sm font-semibold text-amber-200">{msg}</p>}
      </div>
    </div>
  );
}
