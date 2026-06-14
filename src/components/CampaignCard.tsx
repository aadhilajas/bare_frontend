import { fmtRelative } from "@/lib/utils";
import StatusBadge from "./StatusBadge";

interface CampaignCardProps {
  name: string;
  channel: string;
  status: "draft" | "sending" | "sent";
  segmentName?: string;
  createdAt: string;
  sentAt?: string | null;
  onClick?: () => void;
}

const CHANNEL_LABEL: Record<string, string> = {
  whatsapp: "WhatsApp",
  sms: "SMS",
  email: "Email",
  rcs: "RCS",
};

export default function CampaignCard({
  name,
  channel,
  status,
  segmentName,
  createdAt,
  sentAt,
  onClick,
}: CampaignCardProps) {
  const dateLine =
    status === "sent" && sentAt
      ? `Sent ${fmtRelative(sentAt)}`
      : `Created ${fmtRelative(createdAt)}`;

  return (
    <div
      onClick={onClick}
      className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-4 cursor-pointer hover:border-indigo-300 hover:shadow-sm transition-all"
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          {CHANNEL_LABEL[channel] ?? channel}
          {segmentName && <> · {segmentName}</>}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0 ml-4">
        <StatusBadge status={status} />
        <p className="text-xs text-gray-400">{dateLine}</p>
      </div>
    </div>
  );
}
