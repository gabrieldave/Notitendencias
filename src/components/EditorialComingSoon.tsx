import { Sparkles } from "lucide-react";

/** Bloque editorial cuando aún no hay tendencias publicadas (sin inventar datos). */
export function EditorialComingSoon() {
  return (
    <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-gradient-to-br from-slate-50 to-white p-10 text-center shadow-inner md:p-12">
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-navy/5 text-brand-orange ring-1 ring-brand-navy/10">
        <Sparkles className="h-7 w-7" aria-hidden />
      </span>
      <p className="mt-4 text-xs font-black uppercase tracking-[0.25em] text-brand-orange">Próximamente</p>
      <h3 className="mt-2 text-xl font-black text-brand-navy md:text-2xl">Las primeras tendencias están en camino</h3>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-600 md:text-base">
        Cuando publiques desde el panel, aparecerán aquí con análisis, score y oportunidades accionables.
      </p>
    </div>
  );
}
