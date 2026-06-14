import type { ReactNode } from "react";

interface MetricCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon?: ReactNode;
  accent?: string;
}

export default function MetricCard({
  label,
  value,
  sub,
  icon,
  accent = "text-gray-900",
}: MetricCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 flex items-start gap-4">
      {icon && (
        <div className="shrink-0 mt-0.5 text-indigo-400">{icon}</div>
      )}
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
          {label}
        </p>
        <p className={`mt-1 text-2xl font-semibold ${accent}`}>{value}</p>
        {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
      </div>
    </div>
  );
}
