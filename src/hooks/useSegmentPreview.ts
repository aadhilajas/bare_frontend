import { useState, useEffect } from "react";
import { segmentsApi, type FilterCondition, type PreviewCustomer } from "@/api/segments";

interface PreviewState {
  count: number | null;
  customers: PreviewCustomer[];
  loading: boolean;
}

/**
 * Debounced live-preview hook for the segment builder.
 *
 * Waits DEBOUNCE_MS after the last filter change before calling
 * POST /api/segments/preview, then returns the matching count and up to 5
 * sample customers.  Stale in-flight requests are silently discarded.
 *
 * Returns { count: null } while idle (no filters) or while debouncing, so
 * the caller can choose to hide the preview panel entirely.
 */
const DEBOUNCE_MS = 600;

export function useSegmentPreview(
  filters: FilterCondition[],
  matchMode: "ALL" | "ANY"
): PreviewState {
  const [count, setCount] = useState<number | null>(null);
  const [customers, setCustomers] = useState<PreviewCustomer[]>([]);
  const [loading, setLoading] = useState(false);

  // Serialize filters to a stable string so the effect only re-runs when the
  // actual filter data changes, not every time the parent re-renders.
  const filtersKey = JSON.stringify(filters);

  useEffect(() => {
    // No filters yet — hide the preview panel entirely.
    if (filters.length === 0) {
      setCount(null);
      setCustomers([]);
      setLoading(false);
      return;
    }

    // A text/city field with an empty string is not yet valid — wait.
    const hasBlank = filters.some((f) => f.value === "");
    if (hasBlank) {
      setCount(null);
      setCustomers([]);
      setLoading(false);
      return;
    }

    // Show a subtle loading indicator immediately; the actual fetch is debounced.
    setLoading(true);
    let cancelled = false;

    const timer = setTimeout(async () => {
      try {
        const res = await segmentsApi.preview(filters, matchMode);
        if (!cancelled) {
          setCount(res.count);
          setCustomers(res.customers);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setCount(null);
          setCustomers([]);
          setLoading(false);
        }
      }
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey, matchMode]);

  return { count, customers, loading };
}
