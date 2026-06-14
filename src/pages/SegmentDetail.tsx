import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Megaphone, Users } from "lucide-react";
import { segmentsApi, parseFilters } from "@/api/segments";
import { useFetch } from "@/hooks/useFetch";
import { useCopilot } from "@/copilot/useCopilot";
import { usePageTitle } from "@/hooks/usePageTitle";
import { filterLabel } from "@/components/SegmentBuilder";
import { fmtDate } from "@/lib/utils";

export default function SegmentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setPageContext } = useCopilot();

  const { data: segment, loading, error } = useFetch(
    () => segmentsApi.get(id!),
    [id]
  );

  usePageTitle(segment ? segment.name : "Segment");

  useEffect(() => {
    if (!segment) return;
    setPageContext({
      page: "segment_detail",
      segment: {
        name: segment.name,
        description: segment.description,
        customer_count: segment.customer_count,
        match_mode: segment.match_mode,
        conditions: parseFilters(segment.filters),
        ai_reasoning: segment.ai_reasoning,
      },
    });
  }, [segment, setPageContext]);

  if (loading) return <Skeleton />;
  if (error || !segment)
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 max-w-md">
        {error ?? "Segment not found."}
      </div>
    );

  const filters = parseFilters(segment.filters);

  return (
    <div className="space-y-8 max-w-3xl">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft size={14} />
        Back to Segments
      </button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{segment.name}</h1>
          {segment.description && (
            <p className="text-sm text-gray-400 mt-0.5">{segment.description}</p>
          )}
          <p className="text-xs text-gray-300 mt-1">
            Created {fmtDate(segment.created_at)}
          </p>
        </div>
        <div className="text-right shrink-0 ml-6">
          <div className="flex items-center gap-1.5 text-indigo-600">
            <Users size={16} />
            <span className="text-2xl font-semibold">
              {segment.customer_count.toLocaleString("en-IN")}
            </span>
          </div>
          <p className="text-xs text-gray-400">customers match</p>
        </div>
      </div>

      {/* Conditions */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">
          Filter Conditions
          <span className="ml-2 text-xs text-gray-400 font-normal">
            Match {segment.match_mode} of
          </span>
        </h2>
        {filters.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No conditions defined.</p>
        ) : (
          <ul className="space-y-2">
            {filters.map((f, i) => (
              <li key={i} className="flex items-center gap-2">
                {i > 0 && (
                  <span className="text-xs text-gray-400 w-8 text-right">
                    {segment.match_mode === "ALL" ? "and" : "or"}
                  </span>
                )}
                <span className="text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700">
                  {filterLabel(f)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* AI reasoning */}
      {segment.ai_reasoning && (
        <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-5">
          <p className="text-xs font-medium text-indigo-500 uppercase tracking-wide mb-2">
            AI Reasoning
          </p>
          <p className="text-sm text-indigo-800 leading-relaxed">
            {segment.ai_reasoning}
          </p>
        </div>
      )}

      {/* CTA */}
      <div className="flex gap-3">
        <button
          onClick={() =>
            navigate("/campaigns", {
              state: { preset_segment_id: segment.id, preset_segment_name: segment.name },
            })
          }
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
        >
          <Megaphone size={14} />
          Create Campaign for This Segment
        </button>
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-4 max-w-3xl">
      <div className="h-8 w-32 bg-gray-100 rounded animate-pulse" />
      <div className="h-24 bg-gray-100 rounded-xl animate-pulse" />
      <div className="h-40 bg-gray-100 rounded-xl animate-pulse" />
    </div>
  );
}
