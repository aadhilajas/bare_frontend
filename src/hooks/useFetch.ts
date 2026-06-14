import { useState, useEffect, useCallback } from "react";

/**
 * Simple data-fetching hook.
 * Re-runs whenever the `deps` array changes (same semantics as useEffect deps).
 * Returns { data, loading, error, refresh }.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useFetch<T>(fetcher: () => Promise<T>, deps: any[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(() => {
    setLoading(true);
    setError(null);
    fetcher()
      .then((d) => {
        setData(d);
        setError(null);
      })
      .catch((e: Error) => setError(e.message ?? "Unexpected error"))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    run();
  }, [run]);

  return { data, loading, error, refresh: run };
}
