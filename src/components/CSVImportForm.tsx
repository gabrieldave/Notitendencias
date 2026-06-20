"use client";

import { adminApiFetch } from "@/lib/admin-api-fetch";
import { useState } from "react";

export function CSVImportForm() {
  const [csv, setCsv] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      const data = await adminApiFetch<{ inserted: number; errors?: string[] }>("/api/admin/import", {
        method: "POST",
        body: JSON.stringify({ csv }),
      });
      setMsg(
        `Insertados: ${data.inserted}. Errores: ${data.errors?.length ? data.errors.join("; ") : "ninguno"}`,
      );
      setCsv("");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-4">
      <textarea
        value={csv}
        onChange={(e) => setCsv(e.target.value)}
        rows={14}
        className="w-full rounded-2xl border border-slate-200 p-4 font-mono text-xs outline-none ring-brand-orange/30 focus:ring-2"
        placeholder="category,source_name,source_url,title,raw_text"
        required
      />
      {msg && <p className="text-sm text-slate-700">{msg}</p>}
      <button
        type="submit"
        disabled={loading}
        className="rounded-full bg-brand-orange px-6 py-3 text-sm font-bold text-white disabled:opacity-50"
      >
        {loading ? "Importando…" : "Importar"}
      </button>
    </form>
  );
}
