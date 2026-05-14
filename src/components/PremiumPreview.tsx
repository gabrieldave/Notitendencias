export function PremiumPreview() {
  return (
    <div className="rounded-3xl border border-dashed border-brand-orange/50 bg-white/80 p-8">
      <p className="text-xs font-bold uppercase tracking-wide text-brand-orange">
        Vista previa premium
      </p>
      <h3 className="mt-2 text-xl font-bold text-brand-navy">
        Cómo se ve una ficha completa de tendencia
      </h3>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
          <p className="font-semibold text-brand-navy">Por qué importa</p>
          <p className="mt-2 text-slate-600">
            Contexto editorial y señales de demanda, sin copiar artículos completos.
          </p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
          <p className="font-semibold text-brand-navy">Oportunidad</p>
          <p className="mt-2 text-slate-600">
            Ángulos de negocio y contenido listos para TikTok, YouTube o newsletter.
          </p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
          <p className="font-semibold text-brand-navy">Score</p>
          <p className="mt-2 text-slate-600">
            Priorización editorial 0–100 para filtrar el ruido del internet.
          </p>
        </div>
      </div>
    </div>
  );
}
