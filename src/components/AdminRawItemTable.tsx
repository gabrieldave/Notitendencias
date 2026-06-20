"use client";

import type { RawTrendItem } from "@/db/schema";
import { EDITORIAL_ARXIV_ALERT_ES, rawItemMentionsArxiv } from "@/lib/editorial";
import { adminApiFetch } from "@/lib/admin-api-fetch";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function AdminRawItemTable({ items }: { items: RawTrendItem[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [batchBusy, setBatchBusy] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(
    null,
  );
  const [authOk, setAuthOk] = useState<boolean | null>(null);

  useEffect(() => {
    adminApiFetch("/api/admin/session")
      .then(() => setAuthOk(true))
      .catch(() => setAuthOk(false));
  }, []);

  async function processOne(id: string) {
    setBusy(id);
    try {
      await adminApiFetch(`/api/process/${id}`, { method: "POST" });
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(null);
    }
  }

  async function processAll() {
    if (
      !confirm(
        `¿Procesar ${items.length} hallazgos uno por uno? Puede tardar varios minutos y consume la API de DeepSeek.`,
      )
    ) {
      return;
    }

    setBatchBusy(true);
    let succeeded = 0;
    let failed = 0;
    const failures: string[] = [];

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      setBatchProgress({ current: i + 1, total: items.length });
      setBusy(it.id);
      try {
        await adminApiFetch(`/api/process/${it.id}`, { method: "POST" });
        succeeded++;
      } catch (e) {
        failed++;
        const msg = e instanceof Error ? e.message : "Error";
        failures.push(`${it.title.slice(0, 40)}…: ${msg}`);
        if (msg.includes("No autorizado")) {
          alert(msg);
          break;
        }
      }
    }

    setBusy(null);
    setBatchProgress(null);
    setBatchBusy(false);
    router.refresh();

    if (succeeded + failed === 0) return;

    const detail =
      failures.length > 0
        ? `\n\nFallos:\n${failures.slice(0, 3).join("\n")}${failures.length > 3 ? `\n… y ${failures.length - 3} más` : ""}`
        : "";
    alert(
      `Procesamiento terminado: ${succeeded}/${items.length} correctos${
        failed ? `, ${failed} fallidos` : ""
      }.${detail}`,
    );
  }

  if (items.length === 0) {
    return <p className="mt-4 text-sm text-slate-600">No hay hallazgos pendientes.</p>;
  }

  return (
    <>
      {authOk === false && (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Sesión admin incompleta.{" "}
          <a href="/admin/login" className="font-semibold underline">
            Entra con la contraseña del panel
          </a>{" "}
          o inicia sesión con Google (email en ADMIN_EMAILS).
        </p>
      )}
      <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
        {batchProgress && (
          <span className="text-xs font-semibold text-slate-600">
            Procesando {batchProgress.current}/{batchProgress.total}…
          </span>
        )}
        <button
          type="button"
          onClick={() => void processAll()}
          disabled={busy !== null || batchBusy}
          className="rounded-full bg-brand-orange px-4 py-2 text-xs font-bold text-white shadow-sm disabled:opacity-50"
        >
          {batchBusy ? "Procesando…" : `Procesar todo (${items.length})`}
        </button>
      </div>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Título</th>
              <th className="px-4 py-3">Categoría</th>
              <th className="px-4 py-3">Fuente</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium text-brand-navy">
                  <div className="flex flex-wrap items-center gap-2">
                    <span>{it.title}</span>
                    {it.metadataJson &&
                      typeof it.metadataJson === "object" &&
                      !Array.isArray(it.metadataJson) &&
                      it.metadataJson.platform === "x" && (
                        <span className="rounded bg-slate-900 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                          X
                        </span>
                      )}
                  </div>
                  {rawItemMentionsArxiv(it) && (
                    <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5 text-xs font-semibold text-amber-950">
                      {EDITORIAL_ARXIV_ALERT_ES}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3">{it.categorySlug}</td>
                <td className="px-4 py-3">{it.sourceName}</td>
                <td className="px-4 py-3 text-xs font-semibold uppercase text-slate-600">
                  {it.status}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => processOne(it.id)}
                    disabled={busy === it.id || batchBusy}
                    className="rounded-full bg-brand-orange px-3 py-1 text-xs font-bold text-white disabled:opacity-50"
                  >
                    {busy === it.id ? "…" : "Procesar"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
