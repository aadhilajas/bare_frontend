import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import CustomerCard from "@/components/CustomerCard";
import { customersApi } from "@/api/customers";
import { useCopilot } from "@/copilot/useCopilot";
import { useFetch } from "@/hooks/useFetch";
import { usePageTitle } from "@/hooks/usePageTitle";

const CITIES = [
  "Mumbai", "Delhi", "Bangalore", "Chennai", "Hyderabad",
  "Kolkata", "Pune", "Ahmedabad", "Jaipur", "Lucknow",
];
const PAGE_SIZE = 20;

export default function Customers() {
  const navigate = useNavigate();
  const { setPageContext } = useCopilot();
  usePageTitle("Customers");

  const [search, setSearch]   = useState("");
  const [city, setCity]       = useState("");
  const [gender, setGender]   = useState("");
  const [page, setPage]       = useState(1);

  const params: Record<string, string | number> = { limit: PAGE_SIZE, page };
  if (search) params.search = search;
  if (city) params.city = city;
  if (gender) params.gender = gender;

  const { data, loading, error } = useFetch(
    () => customersApi.list(params),
    [search, city, gender, page]
  );

  // Reset to page 1 on filter change
  useEffect(() => { setPage(1); }, [search, city, gender]);

  useEffect(() => {
    setPageContext({
      page: "customers",
      total: data?.total ?? 0,
      active_filters: { search, city, gender },
    });
  }, [data?.total, search, city, gender, setPageContext]);

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {data ? `${data.total.toLocaleString("en-IN")} total` : "Loading…"}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or email…"
            className="pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 w-60"
          />
        </div>

        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-white"
        >
          <option value="">All cities</option>
          {CITIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select
          value={gender}
          onChange={(e) => setGender(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-white"
        >
          <option value="">All genders</option>
          <option value="female">Female</option>
          <option value="male">Male</option>
          <option value="other">Other</option>
        </select>

        {(search || city || gender) && (
          <button
            onClick={() => { setSearch(""); setCity(""); setGender(""); }}
            className="text-sm text-gray-400 hover:text-gray-600 px-3 py-2"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* List */}
      {error && <ErrorState message={error} />}
      {loading && !data && <Skeleton rows={6} />}

      {data && (
        <>
          <div className={`space-y-2 transition-opacity duration-150 ${loading ? "opacity-50 pointer-events-none" : ""}`}>
            {data.customers.map((c) => (
              <CustomerCard
                key={c.id}
                name={c.name}
                email={c.email}
                city={c.city}
                gender={c.gender}
                totalSpend={c.total_spend}
                totalOrders={c.total_orders}
                lastOrderDate={c.last_order_date}
                onClick={() => navigate(`/customers/${c.id}`)}
              />
            ))}
          </div>

          {data.customers.length === 0 && (
            <div className="rounded-xl border border-dashed border-gray-200 px-6 py-12 text-center space-y-2">
              <p className="text-sm text-gray-400">No customers match your filters.</p>
              {(search || city || gender) && (
                <button
                  onClick={() => { setSearch(""); setCity(""); setGender(""); }}
                  className="text-xs text-indigo-500 hover:text-indigo-700 transition-colors"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-500">
                {page} / {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Skeleton({ rows }: { rows: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />
      ))}
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
      {message}
    </div>
  );
}
