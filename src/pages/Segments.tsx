import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Plus, X, Loader2, Users } from "lucide-react";
import { segmentsApi, type FilterCondition, type SegmentCreate, type PreviewCustomer } from "@/api/segments";
import { useFetch } from "@/hooks/useFetch";
import { useSegmentPreview } from "@/hooks/useSegmentPreview";
import { useCopilot } from "@/copilot/useCopilot";
import { usePageTitle } from "@/hooks/usePageTitle";
import SegmentBuilder from "@/components/SegmentBuilder";
import { fmtRelative } from "@/lib/utils";

export default function Segments() {
  const navigate = useNavigate();
  const { setPageContext } = useCopilot();
  usePageTitle("Segments");

  const { data: segments, loading, error, refresh } = useFetch(
    () => segmentsApi.list(),
    []
  );

  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    setPageContext({
      page: "segments",
      total: segments?.length ?? 0,
      segments: segments?.map((s) => ({ id: s.id, name: s.name, customer_count: s.customer_count })) ?? [],
    });
  }, [segments, setPageContext]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Segments</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {segments ? `${segments.length} audience groups` : "Loading…"}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
        >
          <Plus size={14} />
          New Segment
        </button>
      </div>

      {error && <ErrorBanner message={error} />}

      {loading && !segments && <Skeleton rows={4} />}

      {segments && (
        <div className="space-y-2">
          {segments.map((s) => (
            <div
              key={s.id}
              onClick={() => navigate(`/segments/${s.id}`)}
              className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-4 cursor-pointer hover:border-indigo-300 hover:shadow-sm transition-all"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900">{s.name}</p>
                {s.description && (
                  <p className="text-xs text-gray-400 mt-0.5 truncate max-w-sm">
                    {s.description}
                  </p>
                )}
                <p className="text-xs text-gray-300 mt-0.5">
                  Created {fmtRelative(s.created_at)}
                </p>
              </div>
              <div className="text-right shrink-0 ml-4">
                <p className="text-sm font-semibold text-indigo-600">
                  {s.customer_count.toLocaleString("en-IN")}
                </p>
                <p className="text-xs text-gray-400">customers</p>
              </div>
            </div>
          ))}
          {segments.length === 0 && (
            <EmptyState message="No segments yet. Create your first audience group." />
          )}
        </div>
      )}

      {/* Create drawer */}
      {showCreate && (
        <CreateSegmentDrawer
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); refresh(); }}
        />
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Create Segment Drawer
// ──────────────────────────────────────────────────────────────────────────────
interface CreateDrawerProps {
  onClose: () => void;
  onCreated: () => void;
}

function CreateSegmentDrawer({ onClose, onCreated }: CreateDrawerProps) {
  const [name, setName]           = useState("");
  const [description, setDesc]    = useState("");
  const [matchMode, setMatchMode] = useState<"ALL" | "ANY">("ALL");
  const [filters, setFilters]     = useState<FilterCondition[]>([]);

  const [nlIntent, setNlIntent]   = useState("");
  const [interpreting, setInterp] = useState(false);
  const [interpNote, setIntNote]  = useState("");

  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveErr]   = useState("");

  const preview = useSegmentPreview(filters, matchMode);

  const handleInterpret = async () => {
    if (!nlIntent.trim()) return;
    setInterp(true);
    setIntNote("");
    try {
      const res = await segmentsApi.interpret(nlIntent.trim());
      if (res.name && !name) setName(res.name);
      if (res.filters.length > 0) {
        setFilters(res.filters);
        setMatchMode(res.match_mode ?? "ALL");
      }
      if (res.explanation) setIntNote(res.explanation);
    } catch {
      setIntNote("Could not interpret — try rewording or add filters manually.");
    } finally {
      setInterp(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) { setSaveErr("Name is required."); return; }
    setSaving(true);
    setSaveErr("");
    try {
      const payload: SegmentCreate = {
        name: name.trim(),
        description: description.trim(),
        filters,
        match_mode: matchMode,
      };
      await segmentsApi.create(payload);
      onCreated();
    } catch (e: unknown) {
      setSaveErr(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/30 z-50 flex justify-end"
      onClick={onClose}
    >
      <div
        className="w-[520px] h-full bg-white shadow-2xl flex flex-col overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <h2 className="text-base font-semibold text-gray-900">New Segment</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* AI Interpret */}
          <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-indigo-700">
              <Sparkles size={14} />
              Describe your audience in plain English
            </div>
            <textarea
              value={nlIntent}
              onChange={(e) => setNlIntent(e.target.value)}
              placeholder="e.g. Customers who spent over ₹3000 and haven't ordered in 60 days"
              rows={2}
              className="w-full text-sm border border-indigo-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
            />
            <button
              onClick={handleInterpret}
              disabled={interpreting || !nlIntent.trim()}
              className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-800 disabled:opacity-50 transition-colors"
            >
              {interpreting ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Sparkles size={13} />
              )}
              {interpreting ? "Interpreting…" : "Interpret with AI"}
            </button>
            {interpNote && (
              <p className="text-xs text-indigo-600 leading-relaxed">{interpNote}</p>
            )}
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-700">
              Segment name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Lapsed High-Value Customers"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-700">
              Description (optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Short note for your team"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          {/* Filter builder */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-700">Conditions</label>
            <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
              <SegmentBuilder
                filters={filters}
                matchMode={matchMode}
                onChange={(f, m) => { setFilters(f); setMatchMode(m); }}
              />
            </div>
          </div>

          {/* Live audience preview */}
          <PreviewPanel
            count={preview.count}
            customers={preview.customers}
            loading={preview.loading}
          />

          {saveError && (
            <p className="text-xs text-red-500">{saveError}</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex gap-3 shrink-0">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-60 transition-colors"
          >
            {saving && <Loader2 size={13} className="animate-spin" />}
            {saving ? "Saving…" : "Create Segment"}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Segment live-preview panel
// ──────────────────────────────────────────────────────────────────────────────

interface PreviewPanelProps {
  count: number | null;
  customers: PreviewCustomer[];
  loading: boolean;
}

function PreviewPanel({ count, customers, loading }: PreviewPanelProps) {
  if (!loading && count === null) return null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      {/* Header row */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
        <Users size={13} className="text-indigo-400 shrink-0" />
        {loading ? (
          <span className="flex items-center gap-1.5 text-xs text-gray-400">
            <Loader2 size={11} className="animate-spin" />
            Counting audience…
          </span>
        ) : (
          <>
            <span className="text-sm font-semibold text-gray-900">
              {count!.toLocaleString("en-IN")}
            </span>
            <span className="text-xs text-gray-500">
              {count === 1 ? "customer matches" : "customers match"}
            </span>
            {count === 0 && (
              <span className="ml-auto text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                Empty audience
              </span>
            )}
          </>
        )}
      </div>

      {/* Sample rows */}
      {!loading && customers.length > 0 && (
        <ul className="divide-y divide-gray-50">
          {customers.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between px-4 py-2.5"
            >
              <span className="text-xs font-medium text-gray-800">{c.name}</span>
              <span className="text-xs text-gray-400">
                {c.city} · ₹{c.total_spend.toLocaleString("en-IN")}
              </span>
            </li>
          ))}
          {count !== null && count > customers.length && (
            <li className="px-4 py-2 text-xs text-gray-400">
              +{(count - customers.length).toLocaleString("en-IN")} more
            </li>
          )}
        </ul>
      )}
    </div>
  );
}


// ──────────────────────────────────────────────────────────────────────────────
// Utility components
// ──────────────────────────────────────────────────────────────────────────────

function Skeleton({ rows }: { rows: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />
      ))}
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
      {message}
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
