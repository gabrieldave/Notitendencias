import Link from "next/link";
import { TrendingUp } from "lucide-react";
import { MOCK_QUICK_SIGNAL } from "@/lib/mock-editorial";

export function QuickSignalCard() {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-amber-50/60 p-5 shadow-soft">
      <div className="flex items-center gap-2 text-brand-navy">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-orange text-white shadow-md shadow-orange-500/20">
          <TrendingUp className="h-5 w-5" aria-hidden />
        </span>
        <h3 className="text-sm font-black uppercase tracking-wide">Señal rápida</h3>
      </div>
      <p className="mt-3 text-sm font-semibold leading-snug text-brand-navy">{MOCK_QUICK_SIGNAL.headline}</p>
      <div className="mt-4 flex h-12 items-end gap-0.5 rounded-lg bg-white/80 px-2 py-1 ring-1 ring-slate-100">
        {[30, 45, 40, 55, 50, 70, 65, 85, 80, 95].map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-sm bg-gradient-to-t from-brand-orange/30 to-brand-orange"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
      <Link
        href={MOCK_QUICK_SIGNAL.ctaHref}
        className="mt-4 inline-flex text-sm font-bold text-brand-orange hover:underline"
      >
        {MOCK_QUICK_SIGNAL.ctaLabel} →
      </Link>
    </div>
  );
}
