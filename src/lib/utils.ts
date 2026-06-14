/** Format a number as Indian Rupees — ₹1,23,456 */
export function fmtINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Format a percentage with one decimal — "84.2%" */
export function fmtPct(rate: number): string {
  return `${rate.toFixed(1)}%`;
}

/**
 * Parse an ISO 8601 datetime string as UTC.
 *
 * The backend stores datetimes as naive UTC in SQLite.  The OrmBase validator
 * now attaches "+00:00" before serialisation, but bare strings (no timezone
 * indicator) would be parsed by JS as local time — which is wrong.  This
 * helper appends "Z" to any string that lacks a timezone suffix, so all
 * timestamps are treated as UTC regardless of whether the suffix is present.
 */
function _parseUTC(s: string): Date {
  // Already has timezone indicator (ends with Z or ±HH:MM) — parse as-is.
  if (/Z$|[+-]\d{2}:\d{2}$/.test(s)) return new Date(s);
  // Bare string — treat as UTC by appending Z.
  return new Date(s + "Z");
}

/** Relative date string — "3 days ago", "just now" */
export function fmtRelative(isoString: string | null): string {
  if (!isoString) return "—";
  const diff = Date.now() - _parseUTC(isoString).getTime();
  const mins = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  return _parseUTC(isoString).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Short date — "12 Jun 2026" */
export function fmtDate(isoString: string | null): string {
  if (!isoString) return "—";
  return _parseUTC(isoString).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Capitalise first letter */
export function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Parse tags JSON string → string[] */
export function parseTags(json: string | null): string[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
