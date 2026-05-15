import { TrendingUp } from "lucide-react";

const sizeStyles = {
  sm: "gap-0.5 px-2 py-0.5 text-[10px] min-w-[2.75rem]",
  md: "gap-1 px-2.5 py-1 text-xs min-w-[3.25rem]",
  lg: "gap-1.5 px-3 py-1.5 text-sm min-w-[4rem]",
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
  return {
    wrap: "border-slate-200 bg-slate-100 text-slate-700",
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
      className={`inline-flex items-center justify-center rounded-full border font-black tabular-nums tracking-tight ${t.wrap} ${sz} ${className}`}
      title={`Score editorial ${score} de 100`}
    >
      {t.icon && size !== "sm" && <TrendingUp className="h-3 w-3 shrink-0 opacity-90" aria-hidden />}
      <span>{score}</span>
      {size === "lg" && <span className="text-[0.65em] font-semibold opacity-80">/100</span>}
    </span>
  );
}
