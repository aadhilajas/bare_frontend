import { fmtINR, fmtRelative } from "@/lib/utils";

interface CustomerCardProps {
  name: string;
  email: string;
  city: string;
  gender: string;
  totalSpend: number;
  totalOrders: number;
  lastOrderDate: string | null;
  onClick?: () => void;
}

export default function CustomerCard({
  name,
  email,
  city,
  gender,
  totalSpend,
  totalOrders,
  lastOrderDate,
  onClick,
}: CustomerCardProps) {
  return (
    <div
      onClick={onClick}
      className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-4 cursor-pointer hover:border-indigo-300 hover:shadow-sm transition-all"
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
        <p className="text-xs text-gray-400 mt-0.5 truncate">
          {email} · {city} · {gender.charAt(0).toUpperCase() + gender.slice(1)}
        </p>
        {lastOrderDate && (
          <p className="text-xs text-gray-400 mt-0.5">
            Last order {fmtRelative(lastOrderDate)}
          </p>
        )}
      </div>
      <div className="text-right shrink-0 ml-4">
        <p className="text-sm font-semibold text-gray-900">{fmtINR(totalSpend)}</p>
        <p className="text-xs text-gray-400">{totalOrders} orders</p>
      </div>
    </div>
  );
}
