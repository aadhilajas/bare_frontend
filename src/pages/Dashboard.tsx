import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Filter, Megaphone, Clock } from "lucide-react";
import MetricCard from "@/components/MetricCard";
import CampaignCard from "@/components/CampaignCard";
import { useFetch } from "@/hooks/useFetch";
import { usePageTitle } from "@/hooks/usePageTitle";
import { customersApi } from "@/api/customers";
import { segmentsApi } from "@/api/segments";
import { campaignsApi, type Campaign } from "@/api/campaigns";
import { useCopilot } from "@/copilot/useCopilot";

export default function Dashboard() {
  const navigate = useNavigate();
  const { setPageContext } = useCopilot();
  usePageTitle("Dashboard");

  const { data: custResp } = useFetch(
    () => customersApi.list({ limit: 1, page: 1 }),
    []
  );
  const { data: segments } = useFetch(() => segmentsApi.list(), []);
  const { data: campaigns } = useFetch(() => campaignsApi.list(), []);

  const totalCustomers = custResp?.total ?? 0;
  const totalSegments = segments?.length ?? 0;
  const campaignsSent = campaigns?.filter((c) => c.status === "sent").length ?? 0;
  const recentCampaigns: Campaign[] = (campaigns ?? []).slice(0, 5);

  // Aggregate naive open rate from channel list — just shows sending activity
  const sendingNow = campaigns?.filter((c) => c.status === "sending").length ?? 0;

  useEffect(() => {
    setPageContext({
      page: "dashboard",
      total_customers: totalCustomers,
      total_segments: totalSegments,
      campaigns_sent: campaignsSent,
      sending_now: sendingNow,
    });
  }, [totalCustomers, totalSegments, campaignsSent, sendingNow, setPageContext]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Bare — your skincare D2C CRM at a glance
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          label="Total Customers"
          value={totalCustomers.toLocaleString("en-IN")}
          sub="in database"
          icon={<Users size={18} />}
        />
        <MetricCard
          label="Segments"
          value={totalSegments}
          sub="audience groups"
          icon={<Filter size={18} />}
        />
        <MetricCard
          label="Campaigns Sent"
          value={campaignsSent}
          sub={`${sendingNow} in-flight`}
          icon={<Megaphone size={18} />}
        />
        <MetricCard
          label="Draft Campaigns"
          value={campaigns?.filter((c) => c.status === "draft").length ?? 0}
          sub="ready to send"
          icon={<Clock size={18} />}
        />
      </div>

      {/* Quick actions */}
      <div className="flex gap-3">
        <button
          onClick={() => navigate("/segments")}
          className="px-4 py-2 text-sm font-medium bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
        >
          + New Segment
        </button>
        <button
          onClick={() => navigate("/campaigns")}
          className="px-4 py-2 text-sm font-medium border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          + New Campaign
        </button>
      </div>

      {/* Recent campaigns */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-900">Recent Campaigns</h2>
          <button
            onClick={() => navigate("/campaigns")}
            className="text-xs text-indigo-500 hover:text-indigo-700"
          >
            View all
          </button>
        </div>
        {recentCampaigns.length === 0 ? (
          <EmptyState message="No campaigns yet. Create one from a segment." />
        ) : (
          <div className="space-y-2">
            {recentCampaigns.map((c) => (
              <CampaignCard
                key={c.id}
                name={c.name}
                channel={c.channel}
                status={c.status}
                createdAt={c.created_at}
                sentAt={c.sent_at}
                onClick={() => navigate(`/campaigns/${c.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Top segments */}
      {(segments?.length ?? 0) > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900">Top Segments</h2>
            <button
              onClick={() => navigate("/segments")}
              className="text-xs text-indigo-500 hover:text-indigo-700"
            >
              View all
            </button>
          </div>
          <div className="space-y-2">
            {segments!.slice(0, 5).map((s) => (
              <div
                key={s.id}
                onClick={() => navigate(`/segments/${s.id}`)}
                className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-3 cursor-pointer hover:border-indigo-300 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{s.name}</p>
                  {s.description && (
                    <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">
                      {s.description}
                    </p>
                  )}
                </div>
                <span className="text-sm font-semibold text-indigo-600">
                  {s.customer_count.toLocaleString("en-IN")} customers
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-200 px-6 py-10 text-center">
      <p className="text-sm text-gray-400">{message}</p>
    </div>
  );
}
