import { TrendingUp } from "lucide-react";

const sizeStyles = {
  sm: "gap-1 px-2 py-1 text-[10px] min-w-0",
  md: "gap-1.5 px-2.5 py-1.5 text-xs min-w-0",
  lg: "gap-2 px-3 py-2 text-sm min-w-0",
} as const;

function tier(score: number) {
  if (score >= 80)
    return {
      wrap: "border-orange-300/80 bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/25",
      icon: true,
    };
  if (score >= 50)
    return {
      wrap: "border-amber-300 bg-gradient-to-br from-amber-100 to-amber-50 text-amber-950",
      icon: false,
    };
  if (score >= 35)
    return {
      wrap: "border-slate-200 bg-slate-100 text-slate-700",
      icon: false,
    };
  return {
    wrap: "border-slate-200/90 bg-slate-50 text-slate-600",
    icon: false,
  };
}

type Props = {
  score: number;
  size?: keyof typeof sizeStyles;
  className?: string;
};

export function TrendScoreBadge({ score, size = "md", className = "" }: Props) {
  const t = tier(score);
  const sz = sizeStyles[size];

  return (
    <span
      className={`inline-flex items-center rounded-full border font-semibold tabular-nums tracking-tight ${t.wrap} ${sz} ${className}`}
      title={`Score editorial: ${score} de 100`}
    >
      {t.icon && size !== "sm" && <TrendingUp className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />}
      {size === "sm" ? (
        <span className="inline-flex items-center gap-0.5 font-black leading-none">
          <span className="text-[8px] font-bold uppercase tracking-wide opacity-75">Score</span>
          <span className="tabular-nums">
            {score}
            <span className="text-[9px] font-bold opacity-70">/100</span>
          </span>
        </span>
      ) : (
        <span className="inline-flex items-baseline gap-0.5 font-black">
          <span className="text-[0.75em] font-semibold opacity-80">Score</span>
          <span>{score}</span>
          <span className="text-[0.9em] font-bold opacity-70">/100</span>
        </span>
      )}
    </span>
  );
}
