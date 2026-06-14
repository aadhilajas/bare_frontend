import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Send, MailCheck, Eye, MousePointerClick,
  BarChart2, Users, AlertCircle,
} from "lucide-react";
import { campaignsApi, type Campaign, type ChannelStats } from "@/api/campaigns";
import { segmentsApi } from "@/api/segments";
import { customersApi } from "@/api/customers";
import { useFetch } from "@/hooks/useFetch";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useCopilot } from "@/copilot/useCopilot";
import MetricCard from "@/components/MetricCard";
import StatusBadge from "@/components/StatusBadge";
import { fmtDate, fmtRelative, fmtPct } from "@/lib/utils";

const CHANNEL_COLOURS: Record<string, string> = {
  whatsapp: "bg-green-100 text-green-700",
  sms:      "bg-blue-100 text-blue-700",
  email:    "bg-amber-100 text-amber-700",
  rcs:      "bg-violet-100 text-violet-700",
};

const FUNNEL_STAGES = [
  { key: "total_sent", label: "Sent",      colour: "bg-sky-400",     textColour: "text-sky-600"     },
  { key: "delivered",  label: "Delivered", colour: "bg-blue-500",    textColour: "text-blue-600"    },
  { key: "opened",     label: "Opened",    colour: "bg-indigo-500",  textColour: "text-indigo-600"  },
  { key: "read",       label: "Read",      colour: "bg-violet-500",  textColour: "text-violet-600"  },
  { key: "clicked",    label: "Clicked",   colour: "bg-green-500",   textColour: "text-green-600"   },
  { key: "failed",     label: "Failed",    colour: "bg-red-400",     textColour: "text-red-500"     },
] as const;

export default function Analytics() {
  const navigate = useNavigate();
  const { setPageContext } = useCopilot();
  usePageTitle("Analytics");

  const { data: agg, loading: aggLoading } = useFetch(
    () => campaignsApi.aggregateStats(),
    []
  );
  const { data: campaigns, loading: campsLoading } = useFetch(
    () => campaignsApi.list(),
    []
  );
  const { data: segments } = useFetch(() => segmentsApi.list(), []);
  const { data: custResp } = useFetch(() => customersApi.list({ limit: 1 }), []);

  const segmentMap: Record<string, string> = {};
  (segments ?? []).forEach((s) => { segmentMap[s.id] = s.name; });

  const sentCampaigns = campaigns?.filter((c) => c.status === "sent") ?? [];

  useEffect(() => {
    setPageContext({
      page: "analytics",
      total_campaigns: campaigns?.length ?? 0,
      sent_campaigns: sentCampaigns.length,
      total_segments: segments?.length ?? 0,
      total_customers: custResp?.total ?? 0,
      delivery_rate: agg?.delivery_rate ?? null,
      open_rate: agg?.open_rate ?? null,
      click_rate: agg?.click_rate ?? null,
    });
  }, [campaigns, sentCampaigns.length, segments, custResp, agg, setPageContext]);

  const hasDeliveryData = (agg?.total_sent ?? 0) > 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Aggregate delivery metrics across all campaigns
        </p>
      </div>

      {/* ── Delivery KPIs ─────────────────────────────────────────────── */}
      {aggLoading && !agg ? (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : hasDeliveryData ? (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <MetricCard
            label="Messages Sent"
            value={agg!.total_sent.toLocaleString("en-IN")}
            sub={`${agg!.failed} failed`}
            icon={<Send size={18} />}
          />
          <MetricCard
            label="Delivery Rate"
            value={`${agg!.delivery_rate}%`}
            sub={`${agg!.delivered.toLocaleString("en-IN")} delivered`}
            icon={<MailCheck size={18} />}
            accent="text-blue-600"
          />
          <MetricCard
            label="Open Rate"
            value={`${agg!.open_rate}%`}
            sub={`${agg!.opened.toLocaleString("en-IN")} opened`}
            icon={<Eye size={18} />}
            accent="text-indigo-600"
          />
          <MetricCard
            label="Click Rate"
            value={`${agg!.click_rate}%`}
            sub={`${agg!.clicked.toLocaleString("en-IN")} clicked`}
            icon={<MousePointerClick size={18} />}
            accent="text-green-600"
          />
        </div>
      ) : (
        /* No sent campaigns yet — show count KPIs as a fallback */
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <MetricCard
            label="Total Customers"
            value={(custResp?.total ?? 0).toLocaleString("en-IN")}
            icon={<Users size={18} />}
          />
          <MetricCard
            label="Segments"
            value={segments?.length ?? 0}
            icon={<BarChart2 size={18} />}
          />
          <MetricCard
            label="Campaigns"
            value={campaigns?.length ?? 0}
            sub={`${campaigns?.filter((c) => c.status === "draft").length ?? 0} drafts`}
            icon={<Send size={18} />}
          />
          <MetricCard
            label="Sent"
            value={sentCampaigns.length}
            icon={<MailCheck size={18} />}
          />
        </div>
      )}

      {/* ── Delivery Funnel ───────────────────────────────────────────── */}
      {hasDeliveryData && agg && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Delivery Funnel</h2>
            <span className="text-xs text-gray-400">
              % of {agg.total_sent.toLocaleString("en-IN")} messages sent
            </span>
          </div>
          <div className="space-y-3">
            {FUNNEL_STAGES.map(({ key, label, colour, textColour }) => {
              const count = (agg as unknown as Record<string, number>)[key] ?? 0;
              const pct   = agg.total_sent > 0 ? (count / agg.total_sent) * 100 : 0;
              return (
                <FunnelBar
                  key={key}
                  label={label}
                  count={count}
                  pct={pct}
                  colour={colour}
                  textColour={textColour}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* ── Channel Performance ───────────────────────────────────────── */}
      {hasDeliveryData && agg && agg.by_channel.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-5">
          <h2 className="text-sm font-semibold text-gray-900">Channel Performance</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {agg.by_channel.map((ch) => (
              <ChannelCard key={ch.channel} ch={ch} />
            ))}
          </div>
        </div>
      )}

      {/* ── Empty delivery state ──────────────────────────────────────── */}
      {!aggLoading && !hasDeliveryData && (
        <div className="rounded-xl border border-dashed border-gray-200 px-6 py-10 text-center space-y-2">
          <AlertCircle size={20} className="text-gray-300 mx-auto" />
          <p className="text-sm text-gray-400">
            No campaigns have been sent yet.
          </p>
          <button
            onClick={() => navigate("/campaigns")}
            className="mt-1 text-xs text-indigo-500 hover:text-indigo-700 transition-colors"
          >
            Go to Campaigns →
          </button>
        </div>
      )}

      {/* ── Campaign Table ────────────────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-gray-900 mb-3">All Campaigns</h2>
        {campsLoading && !campaigns && <Skeleton rows={4} />}
        {campaigns && campaigns.length > 0 ? (
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs text-gray-500 font-medium">
                    Campaign
                  </th>
                  <th className="px-4 py-3 text-left text-xs text-gray-500 font-medium">
                    Segment
                  </th>
                  <th className="px-4 py-3 text-left text-xs text-gray-500 font-medium">
                    Channel
                  </th>
                  <th className="px-4 py-3 text-left text-xs text-gray-500 font-medium">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs text-gray-500 font-medium">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c: Campaign) => (
                  <tr
                    key={c.id}
                    className="border-b border-gray-100 last:border-0 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/campaigns/${c.id}`)}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 max-w-xs truncate">
                      {c.name}
                    </td>
                    <td className="px-4 py-3 text-gray-500 max-w-[140px] truncate">
                      {segmentMap[c.segment_id] ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          CHANNEL_COLOURS[c.channel] ?? "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {c.channel.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-gray-400">
                      {c.sent_at
                        ? fmtDate(c.sent_at)
                        : fmtRelative(c.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          !campsLoading && (
            <div className="rounded-xl border border-dashed border-gray-200 px-6 py-10 text-center">
              <p className="text-sm text-gray-400">No campaigns yet.</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────────────────────────────────────

interface FunnelBarProps {
  label: string;
  count: number;
  pct: number;
  colour: string;
  textColour: string;
}

function FunnelBar({ label, count, pct, colour, textColour }: FunnelBarProps) {
  return (
    <div className="flex items-center gap-4">
      <span className="text-xs text-gray-500 w-16 shrink-0">{label}</span>
      <div className="flex-1 h-2.5 rounded-full bg-gray-100 overflow-hidden">
        <div
          className={`h-full rounded-full ${colour} transition-all duration-700`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <span className={`text-sm font-semibold w-16 text-right ${textColour}`}>
        {count.toLocaleString("en-IN")}
      </span>
      <span className="text-xs text-gray-400 w-12 text-right">
        {fmtPct(pct)}
      </span>
    </div>
  );
}

function ChannelCard({ ch }: { ch: ChannelStats }) {
  const colourCls = CHANNEL_COLOURS[ch.channel] ?? "bg-gray-100 text-gray-600";
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-3">
      {/* Channel badge + campaign count */}
      <div className="flex items-center justify-between">
        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${colourCls}`}>
          {ch.channel.toUpperCase()}
        </span>
        <span className="text-xs text-gray-400">
          {ch.campaigns} campaign{ch.campaigns !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Messages sent */}
      <div>
        <p className="text-xl font-bold text-gray-900">
          {ch.total_sent.toLocaleString("en-IN")}
        </p>
        <p className="text-xs text-gray-400">messages</p>
      </div>

      {/* Mini rate bars */}
      <div className="space-y-2">
        <RateMini label="Delivered" value={ch.delivery_rate} colour="bg-blue-400" />
        <RateMini label="Opened"    value={ch.open_rate}     colour="bg-indigo-400" />
        <RateMini label="Clicked"   value={ch.click_rate}    colour="bg-green-400" />
      </div>
    </div>
  );
}

function RateMini({
  label,
  value,
  colour,
}: {
  label: string;
  value: number;
  colour: string;
}) {
  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-500">{label}</span>
        <span className="font-medium text-gray-700">{value.toFixed(1)}%</span>
      </div>
      <div className="h-1 rounded-full bg-gray-200 overflow-hidden">
        <div
          className={`h-full rounded-full ${colour} transition-all duration-500`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  );
}

function Skeleton({ rows }: { rows: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 rounded-xl bg-gray-100 animate-pulse" />
      ))}
    </div>
  );
}
