export function TrendScoreBadge({ score }: { score: number }) {
  const tone =
    score >= 80
      ? "bg-orange-100 text-orange-900 border-orange-200"
      : score >= 50
        ? "bg-amber-100 text-amber-900 border-amber-200"
        : "bg-slate-100 text-slate-700 border-slate-200";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-bold ${tone}`}
    >
      Score {score}
    </span>
  );
}
