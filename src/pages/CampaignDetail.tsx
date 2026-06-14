import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Send, Loader2, RefreshCw,
  CheckCircle, AlertCircle, X,
} from "lucide-react";
import { campaignsApi, type Message } from "@/api/campaigns";
import { segmentsApi, type Segment } from "@/api/segments";
import { usePolling } from "@/hooks/usePolling";
import { useFetch } from "@/hooks/useFetch";
import { useCopilot } from "@/copilot/useCopilot";
import { usePageTitle } from "@/hooks/usePageTitle";
import StatusBadge from "@/components/StatusBadge";
import { fmtRelative, fmtPct } from "@/lib/utils";

const FUNNEL = [
  { key: "total_sent",  label: "Sent",      colour: "bg-sky-400" },
  { key: "delivered",   label: "Delivered",  colour: "bg-blue-500" },
  { key: "opened",      label: "Opened",     colour: "bg-indigo-500" },
  { key: "read",        label: "Read",       colour: "bg-violet-500" },
  { key: "clicked",     label: "Clicked",    colour: "bg-green-500" },
  { key: "failed",      label: "Failed",     colour: "bg-red-400" },
] as const;

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setPageContext } = useCopilot();

  // One-shot initial fetch
  const { data: initial, loading: initLoading } = useFetch(
    () => campaignsApi.get(id!),
    [id]
  );

  /**
   * isSending drives the polling interval.
   * It is a state variable rather than a plain derived value so that:
   *   1. Clicking "Send" can enable polling immediately (before the next
   *      fetch returns the updated status).
   *   2. When polled data shows "sent", the effect below disables polling,
   *      which correctly stops the interval even though `initial` was
   *      fetched as "sending" and will never change.
   */
  const [isSending, setIsSending] = useState(false);

  const { data: polled } = usePolling(
    () => campaignsApi.get(id!),
    3000,
    isSending
  );

  const campaign = polled ?? initial;
  const stats = campaign?.stats;

  usePageTitle(campaign ? campaign.name : "Campaign");

  // Keep isSending in sync with the live campaign status
  useEffect(() => {
    if (!campaign?.status) return;
    if (campaign.status === "sending") setIsSending(true);
    else setIsSending(false);
  }, [campaign?.status]);

  // Messages list — refresh every 5s while sending
  const { data: messages } = usePolling(
    () => campaignsApi.messages(id!),
    5000,
    isSending
  );

  // Segment name
  const { data: segment } = useFetch(
    () => (campaign?.segment_id ? segmentsApi.get(campaign.segment_id) : Promise.resolve(null)),
    [campaign?.segment_id]
  );

  // Send action
  const [sending, setSending]         = useState(false);
  const [sendError, setSendError]     = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  const handleSend = async () => {
    if (!campaign) return;
    setSending(true);
    setSendError("");
    try {
      await campaignsApi.send(campaign.id);
      setShowConfirm(false);
      setSendSuccess(true);
      // Enable polling immediately — don't wait for the next useEffect tick
      setIsSending(true);
      // Auto-dismiss the success banner after 5 s
      setTimeout(() => setSendSuccess(false), 5000);
    } catch (e: unknown) {
      setSendError(e instanceof Error ? e.message : "Send failed.");
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (!campaign || !stats) return;
    setPageContext({
      page: "campaign_detail",
      campaign: {
        name: campaign.name,
        channel: campaign.channel,
        status: campaign.status,
      },
      stats,
    });
  }, [campaign, stats, setPageContext]);

  if (initLoading) return <Skeleton />;
  if (!campaign)
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 max-w-md">
        Campaign not found.
      </div>
    );

  const total = stats?.total_sent ?? 0;

  return (
    <div className="space-y-8 max-w-4xl">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft size={14} />
        Back to Campaigns
      </button>

      {/* Campaign header */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{campaign.name}</h1>
            <p className="text-sm text-gray-400 mt-1">
              {campaign.channel.toUpperCase()} ·{" "}
              {segment?.name ?? campaign.segment_id}
            </p>
            <p className="text-xs text-gray-300 mt-0.5">
              Created {fmtRelative(campaign.created_at)}
              {campaign.sent_at && ` · Sent ${fmtRelative(campaign.sent_at)}`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={campaign.status} />
            {campaign.status === "sending" && (
              <RefreshCw size={13} className="text-amber-400 animate-spin" />
            )}
            {campaign.status === "draft" && (
              <button
                onClick={() => setShowConfirm(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
              >
                <Send size={13} />
                Send Campaign
              </button>
            )}
          </div>
        </div>

        {/* Message template preview */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-400 mb-1.5 font-medium uppercase tracking-wide">
            Message Template
          </p>
          <p className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2.5 leading-relaxed">
            {campaign.message_template}
          </p>
        </div>

        {campaign.ai_reasoning && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-indigo-400 mb-1.5 font-medium uppercase tracking-wide">
              AI Reasoning
            </p>
            <p className="text-sm text-indigo-700 leading-relaxed">
              {campaign.ai_reasoning}
            </p>
          </div>
        )}
      </div>

      {/* Success banner — shown immediately after confirming send */}
      {sendSuccess && (
        <div className="flex items-center gap-2.5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <CheckCircle size={15} className="text-green-500 shrink-0" />
          Campaign dispatched — messages are being sent to{" "}
          <strong>
            {segment?.customer_count?.toLocaleString("en-IN") ?? "the audience"}
          </strong>
          . Stats will update live below.
        </div>
      )}

      {/* Draft nudge — visible only while the campaign hasn't been sent */}
      {campaign.status === "draft" && !sendSuccess && (
        <div className="rounded-xl border border-dashed border-gray-200 px-6 py-8 text-center space-y-1">
          <p className="text-sm text-gray-500 font-medium">Ready to send?</p>
          <p className="text-xs text-gray-400">
            Click <span className="font-medium text-gray-600">Send Campaign</span> above to dispatch messages and start tracking delivery stats.
          </p>
        </div>
      )}

      {/* Delivery funnel */}
      {stats && total > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">
              Delivery Funnel
            </h2>
            {campaign.status === "sending" && (
              <span className="text-xs text-amber-500 flex items-center gap-1">
                <RefreshCw size={11} className="animate-spin" />
                Live
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            {FUNNEL.map(({ key, label, colour }) => {
              const val = (stats as unknown as Record<string, number>)[key] ?? 0;
              const pct = total > 0 ? (val / total) * 100 : 0;
              return (
                <div key={key} className="space-y-1.5">
                  <div className="flex items-end justify-between">
                    <span className="text-xs text-gray-500">{label}</span>
                    <span className="text-sm font-semibold text-gray-900">{val}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${colour} transition-all duration-700`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400">{fmtPct(pct)}</span>
                </div>
              );
            })}
          </div>

          {/* Rate pills */}
          <div className="flex gap-6 pt-2 border-t border-gray-100">
            <RatePill label="Delivery rate" value={fmtPct(stats.delivery_rate)} />
            <RatePill label="Open rate"     value={fmtPct(stats.open_rate)} />
            <RatePill label="Click rate"    value={fmtPct(stats.click_rate)} />
          </div>
        </div>
      )}

      {/* Messages table */}
      {messages && messages.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-900 mb-3">
            Messages
            <span className="ml-2 text-gray-400 font-normal">
              ({messages.length})
            </span>
          </h2>
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs text-gray-500 font-medium">
                    Message
                  </th>
                  <th className="px-4 py-3 text-left text-xs text-gray-500 font-medium">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs text-gray-500 font-medium">
                    Last event
                  </th>
                </tr>
              </thead>
              <tbody>
                {messages.slice(0, 50).map((m: Message) => (
                  <tr key={m.id} className="border-b border-gray-100 last:border-0">
                    <td className="px-4 py-3 text-gray-700 max-w-xs truncate">
                      {m.personalised_text}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={m.status} />
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-gray-400">
                      {m.failed_reason
                        ? <span className="text-red-400">{m.failed_reason}</span>
                        : fmtRelative(
                            m.clicked_at ?? m.read_at ?? m.opened_at ?? m.delivered_at ?? m.sent_at ?? null
                          )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {messages.length > 50 && (
              <p className="px-4 py-2 text-xs text-gray-400 border-t border-gray-100">
                Showing first 50 of {messages.length} messages.
              </p>
            )}
          </div>
        </div>
      )}
      {showConfirm && campaign && (
        <SendConfirmModal
          campaign={campaign}
          segment={segment ?? null}
          onConfirm={handleSend}
          onCancel={() => { setShowConfirm(false); setSendError(""); }}
          sending={sending}
          error={sendError}
        />
      )}
    </div>
  );
}

function RatePill({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-base font-semibold text-gray-900 mt-0.5">{value}</p>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Send confirmation modal
// ──────────────────────────────────────────────────────────────────────────────

const CHANNEL_LABELS: Record<string, string> = {
  whatsapp: "WhatsApp",
  sms: "SMS",
  email: "Email",
  rcs: "RCS",
};

interface SendConfirmProps {
  campaign: { name: string; channel: string; message_template: string };
  segment: Segment | null;
  onConfirm: () => void;
  onCancel: () => void;
  sending: boolean;
  error: string;
}

function SendConfirmModal({
  campaign,
  segment,
  onConfirm,
  onCancel,
  sending,
  error,
}: SendConfirmProps) {
  const count = segment?.customer_count ?? 0;
  const channelLabel = CHANNEL_LABELS[campaign.channel] ?? campaign.channel.toUpperCase();

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Confirm Send</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Once sent, this cannot be undone.
            </p>
          </div>
          <button
            onClick={onCancel}
            disabled={sending}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-40"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Campaign summary row */}
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {campaign.name}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {channelLabel}
                {segment && ` · ${segment.name}`}
              </p>
            </div>
            {count > 0 && (
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold text-indigo-600">
                  {count.toLocaleString("en-IN")}
                </p>
                <p className="text-xs text-gray-400">recipients</p>
              </div>
            )}
          </div>

          {/* Message preview */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Message preview
            </p>
            <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {campaign.message_template}
              </p>
            </div>
          </div>

          {/* Error banner */}
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-600">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button
            onClick={onConfirm}
            disabled={sending}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-60 transition-colors"
          >
            {sending ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Send size={13} />
            )}
            {sending
              ? "Sending…"
              : count > 0
              ? `Send to ${count.toLocaleString("en-IN")} customers`
              : "Send Campaign"}
          </button>
          <button
            onClick={onCancel}
            disabled={sending}
            className="px-4 py-2.5 text-sm border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-4 max-w-4xl">
      <div className="h-8 w-32 bg-gray-100 rounded animate-pulse" />
      <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
      <div className="h-40 bg-gray-100 rounded-xl animate-pulse" />
    </div>
  );
}
