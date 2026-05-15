import type { Trend } from "@/db/schema";
import { TrendCardCompact } from "./TrendCardCompact";

type Props = {
  trends: Trend[];
  title?: string;
  subtitle?: string;
};

export function MostViewedSidebar({ trends, title = "Lo más visto", subtitle = "Por score editorial" }: Props) {
  const slice = trends.slice(0, 5);
  if (slice.length === 0) return null;

  return (
    <div className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-soft md:p-6">
      <h3 className="text-lg font-black text-brand-navy">{title}</h3>
      <p className="mt-0.5 text-xs font-medium text-slate-500">{subtitle}</p>
      <div className="mt-4 flex flex-col divide-y divide-slate-100">
        {slice.map((t, i) => (
          <TrendCardCompact key={t.id} trend={t} rank={i + 1} />
        ))}
      </div>
    </div>
  );
}
