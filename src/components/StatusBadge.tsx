import { cn } from "@/lib/cn";

type Status =
  | "draft"
  | "sending"
  | "sent"
  | "queued"
  | "delivered"
  | "opened"
  | "read"
  | "clicked"
  | "failed";

const MAP: Record<Status, string> = {
  draft:     "bg-gray-100 text-gray-600",
  queued:    "bg-gray-100 text-gray-600",
  sending:   "bg-amber-100 text-amber-700",
  sent:      "bg-sky-100 text-sky-700",
  delivered: "bg-blue-100 text-blue-700",
  opened:    "bg-indigo-100 text-indigo-700",
  read:      "bg-violet-100 text-violet-700",
  clicked:   "bg-green-100 text-green-700",
  failed:    "bg-red-100 text-red-600",
};

const LABELS: Record<Status, string> = {
  draft:     "Draft",
  queued:    "Queued",
  sending:   "Sending…",
  sent:      "Sent",
  delivered: "Delivered",
  opened:    "Opened",
  read:      "Read",
  clicked:   "Clicked",
  failed:    "Failed",
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const colour = MAP[status as Status] ?? "bg-gray-100 text-gray-500";
  const label  = LABELS[status as Status] ?? status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <span
      className={cn(
        "inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full",
        colour,
        className
      )}
    >
      {label}
    </span>
  );
}
