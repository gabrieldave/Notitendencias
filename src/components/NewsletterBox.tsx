"use client";

import { useState } from "react";

export function NewsletterBox() {
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
    <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-amber-50 to-sky-50 p-8 shadow-sm">
      <h3 className="text-xl font-bold text-brand-navy">Newsletter Notitendencias</h3>
      <p className="mt-2 text-sm text-slate-600">
        Recibe un resumen con señales accionables. Sin ruido, sin copiar notas completas.
      </p>
      <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@correo.com"
          className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none ring-brand-orange/30 focus:ring-2"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-brand-orange px-6 py-3 text-sm font-bold text-white shadow hover:bg-orange-600 disabled:opacity-60"
        >
          {loading ? "Enviando…" : "Suscribirme"}
        </button>
      </form>
      {msg && <p className="mt-3 text-sm text-slate-700">{msg}</p>}
    </div>
  );
}
