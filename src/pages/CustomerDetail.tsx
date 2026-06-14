import { useEffect, type ReactNode } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Phone, Mail, ShoppingBag } from "lucide-react";
import { customersApi, type Order } from "@/api/customers";
import { useFetch } from "@/hooks/useFetch";
import { useCopilot } from "@/copilot/useCopilot";
import { usePageTitle } from "@/hooks/usePageTitle";
import StatusBadge from "@/components/StatusBadge";
import { fmtINR, fmtDate, fmtRelative, parseTags, capitalise } from "@/lib/utils";

const CATEGORY_COLOUR: Record<string, string> = {
  moisturiser: "bg-pink-100 text-pink-700",
  serum:       "bg-indigo-100 text-indigo-700",
  spf:         "bg-amber-100 text-amber-700",
  cleanser:    "bg-teal-100 text-teal-700",
  toner:       "bg-violet-100 text-violet-700",
};

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setPageContext } = useCopilot();

  const { data: customer, loading, error } = useFetch(
    () => customersApi.get(id!),
    [id]
  );

  usePageTitle(customer ? customer.name : "Customer");

  useEffect(() => {
    if (!customer) return;
    setPageContext({
      page: "customer_detail",
      customer: {
        name: customer.name,
        city: customer.city,
        gender: customer.gender,
        total_spend: customer.total_spend,
        total_orders: customer.total_orders,
        last_order_date: customer.last_order_date,
        tags: parseTags(customer.tags),
      },
    });
  }, [customer, setPageContext]);

  if (loading) return <Skeleton />;
  if (error || !customer)
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 max-w-md">
        {error ?? "Customer not found."}
      </div>
    );

  const tags = parseTags(customer.tags);

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft size={14} />
        Back to Customers
      </button>

      {/* Profile card */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{customer.name}</h1>
            <p className="text-sm text-gray-400 mt-0.5">{capitalise(customer.gender)}</p>
          </div>
          <div className="flex flex-wrap gap-1.5 justify-end">
            {tags.map((t) => (
              <span
                key={t}
                className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full"
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
          <InfoRow icon={<Mail size={13} />} label="Email" value={customer.email} />
          <InfoRow icon={<Phone size={13} />} label="Phone" value={customer.phone} />
          <InfoRow icon={<MapPin size={13} />} label="City" value={customer.city} />
          <InfoRow
            icon={<ShoppingBag size={13} />}
            label="Last order"
            value={fmtRelative(customer.last_order_date)}
          />
        </div>

        {/* Spend / order stats */}
        <div className="flex gap-8 pt-2 border-t border-gray-100">
          <StatPill label="Total Spend" value={fmtINR(customer.total_spend)} />
          <StatPill label="Orders" value={String(customer.total_orders)} />
          <StatPill
            label="Avg Order"
            value={
              customer.total_orders > 0
                ? fmtINR(customer.total_spend / customer.total_orders)
                : "—"
            }
          />
          <StatPill label="Member since" value={fmtDate(customer.created_at)} />
        </div>
      </div>

      {/* Order history */}
      <div>
        <h2 className="text-sm font-semibold text-gray-900 mb-3">
          Order History
          <span className="ml-2 text-gray-400 font-normal">
            ({customer.orders.length})
          </span>
        </h2>
        {customer.orders.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 px-6 py-10 text-center">
            <p className="text-sm text-gray-400">No orders on record yet.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs text-gray-500 font-medium">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs text-gray-500 font-medium">
                    Category
                  </th>
                  <th className="px-4 py-3 text-right text-xs text-gray-500 font-medium">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-right text-xs text-gray-500 font-medium">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {customer.orders
                  .slice()
                  .sort(
                    (a, b) =>
                      new Date(b.created_at).getTime() -
                      new Date(a.created_at).getTime()
                  )
                  .map((order: Order) => (
                    <tr
                      key={order.id}
                      className="border-b border-gray-100 last:border-0"
                    >
                      <td className="px-4 py-3 text-gray-600">
                        {fmtDate(order.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            CATEGORY_COLOUR[order.product_category] ??
                            "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {order.product_category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">
                        {fmtINR(order.amount)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <StatusBadge status={order.status} />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 text-gray-600">
      <span className="text-gray-400">{icon}</span>
      <span className="text-gray-400">{label}:</span>
      <span className="font-medium truncate">{value}</span>
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm font-semibold text-gray-900 mt-0.5">{value}</p>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-4 max-w-3xl">
      <div className="h-8 w-32 bg-gray-100 rounded animate-pulse" />
      <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
      <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
    </div>
  );
}
