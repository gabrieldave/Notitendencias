import Link from "next/link";

type Props = {
  title: string;
  subtitle?: string;
  action?: { href: string; label: string };
  className?: string;
};

export function SectionHeader({ title, subtitle, action, className = "" }: Props) {
  return (
    <div className={`flex flex-wrap items-end justify-between gap-4 ${className}`}>
      <div>
        <h2 className="text-2xl font-black tracking-tight text-brand-navy md:text-3xl">{title}</h2>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-slate-600 md:text-base">{subtitle}</p>}
      </div>
      {action && (
        <Link
          href={action.href}
          className="shrink-0 text-sm font-bold text-brand-orange underline decoration-2 underline-offset-4 transition hover:text-orange-700 hover:no-underline"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
