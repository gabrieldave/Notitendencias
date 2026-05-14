export function PricingTeaser() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Gratis</p>
        <h3 className="mt-2 text-2xl font-bold text-brand-navy">Señales abiertas</h3>
        <ul className="mt-4 space-y-2 text-sm text-slate-600">
          <li>• Tendencias publicadas en la web</li>
          <li>• Resúmenes editoriales breves</li>
          <li>• Newsletter semanal (en construcción)</li>
        </ul>
      </div>
      <div className="rounded-3xl border-2 border-brand-orange bg-brand-navy p-8 text-white shadow-lg">
        <p className="text-xs font-bold uppercase tracking-wide text-amber-200">Premium</p>
        <h3 className="mt-2 text-2xl font-bold">Ideas y oportunidades</h3>
        <ul className="mt-4 space-y-2 text-sm text-slate-100">
          <li>• Alertas de alto score</li>
          <li>• Ideas de contenido y negocio ampliadas</li>
          <li>• Acceso anticipado por categoría</li>
        </ul>
        <p className="mt-4 text-xs text-slate-300">
          Lanzamiento próximo · compatible con automatización n8n
        </p>
      </div>
    </div>
  );
}
