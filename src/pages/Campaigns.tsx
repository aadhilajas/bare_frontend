import { useState, useEffect, type ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Plus, X, Loader2, Sparkles } from "lucide-react";
import { campaignsApi, type Campaign } from "@/api/campaigns";
import { segmentsApi, type Segment } from "@/api/segments";
import { copilotApi } from "@/api/copilot";
import { useFetch } from "@/hooks/useFetch";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useCopilot } from "@/copilot/useCopilot";
import CampaignCard from "@/components/CampaignCard";

const CHANNELS = ["whatsapp", "sms", "email", "rcs"] as const;
const CHANNEL_LABELS: Record<string, string> = {
  whatsapp: "WhatsApp",
  sms: "SMS",
  email: "Email",
  rcs: "RCS",
};

const PERSONALIZATION_HINTS = `Use {{name}}, {{first_name}}, or {{city}} for personalisation.`;

export default function Campaigns() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setPageContext } = useCopilot();
  usePageTitle("Campaigns");

  const { data: campaigns, loading, refresh } = useFetch(
    () => campaignsApi.list(),
    []
  );
  const { data: segments } = useFetch(() => segmentsApi.list(), []);

  // Pre-select a segment if coming from SegmentDetail
  const presetState = location.state as
    | { preset_segment_id?: string; preset_segment_name?: string }
    | null;
  const [showCreate, setShowCreate] = useState(!!presetState?.preset_segment_id);

  useEffect(() => {
    setPageContext({
      page: "campaigns",
      total: campaigns?.length ?? 0,
      sent: campaigns?.filter((c) => c.status === "sent").length ?? 0,
      sending: campaigns?.filter((c) => c.status === "sending").length ?? 0,
    });
  }, [campaigns, setPageContext]);

  const segmentMap: Record<string, string> = {};
  (segments ?? []).forEach((s: Segment) => { segmentMap[s.id] = s.name; });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Campaigns</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {campaigns ? `${campaigns.length} total` : "Loading…"}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
        >
          <Plus size={14} />
          New Campaign
        </button>
      </div>

      {loading && !campaigns && <Skeleton rows={4} />}

      {campaigns && (
        <div className="space-y-2">
          {campaigns.map((c: Campaign) => (
            <CampaignCard
              key={c.id}
              name={c.name}
              channel={c.channel}
              status={c.status}
              segmentName={segmentMap[c.segment_id]}
              createdAt={c.created_at}
              sentAt={c.sent_at}
              onClick={() => navigate(`/campaigns/${c.id}`)}
            />
          ))}
          {campaigns.length === 0 && (
            <EmptyState message="No campaigns yet. Create one from a segment." />
          )}
        </div>
      )}

      {showCreate && (
        <CreateCampaignDrawer
          segments={segments ?? []}
          presetSegmentId={presetState?.preset_segment_id}
          onClose={() => setShowCreate(false)}
          onCreated={(id) => { setShowCreate(false); refresh(); navigate(`/campaigns/${id}`); }}
        />
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Create Campaign Drawer
// ──────────────────────────────────────────────────────────────────────────────
interface CreateDrawerProps {
  segments: Segment[];
  presetSegmentId?: string;
  onClose: () => void;
  onCreated: (id: string) => void;
}

function CreateCampaignDrawer({
  segments,
  presetSegmentId,
  onClose,
  onCreated,
}: CreateDrawerProps) {
  const [name, setName]           = useState("");
  const [segmentId, setSegmentId] = useState(presetSegmentId ?? "");
  const [channel, setChannel]     = useState<string>("whatsapp");
  const [template, setTemplate]   = useState("");

  const [drafting, setDrafting]   = useState(false);
  const [draftNote, setDraftNote] = useState("");
  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveErr]   = useState("");

  const selectedSegment = segments.find((s) => s.id === segmentId);

  const handleAIDraft = async () => {
    if (!segmentId) { setDraftNote("Select a segment first."); return; }
    setDrafting(true);
    setDraftNote("");
    try {
      const res = await copilotApi.chat({
        message: `Draft a short ${CHANNEL_LABELS[channel] ?? channel} message for a skincare brand campaign targeting: ${selectedSegment?.name ?? "this segment"}. ${selectedSegment?.description ? "Segment: " + selectedSegment.description : ""} Keep it under 160 characters, warm and persuasive. Use {{first_name}} for personalisation. Output only the message text.`,
        current_page: "/campaigns",
        data_context: { segment: selectedSegment },
      });
      setTemplate(res.assistant_text.trim());
      setDraftNote("AI draft applied — feel free to edit.");
    } catch {
      setDraftNote("Could not generate draft. Try again.");
    } finally {
      setDrafting(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim())    { setSaveErr("Campaign name is required."); return; }
    if (!segmentId)      { setSaveErr("Select a segment."); return; }
    if (!template.trim()) { setSaveErr("Message template is required."); return; }
    setSaving(true);
    setSaveErr("");
    try {
      const campaign = await campaignsApi.create({
        name: name.trim(),
        segment_id: segmentId,
        channel: channel as Campaign["channel"],
        message_template: template.trim(),
        ai_reasoning: null,
      });
      onCreated(campaign.id);
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
        className="w-[520px] h-full bg-white shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <h2 className="text-base font-semibold text-gray-900">New Campaign</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Name */}
          <Field label="Campaign name" required>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Win-back Lapsed Customers — June"
              className={inputCls}
            />
          </Field>

          {/* Segment */}
          <Field label="Audience segment" required>
            <select
              value={segmentId}
              onChange={(e) => setSegmentId(e.target.value)}
              className={inputCls}
            >
              <option value="">Select a segment…</option>
              {segments.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.customer_count} customers)
                </option>
              ))}
            </select>
          </Field>

          {/* Channel */}
          <Field label="Channel" required>
            <div className="flex gap-2 flex-wrap">
              {CHANNELS.map((ch) => (
                <button
                  key={ch}
                  onClick={() => setChannel(ch)}
                  className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                    channel === ch
                      ? "bg-indigo-500 text-white border-indigo-500"
                      : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"
                  }`}
                >
                  {CHANNEL_LABELS[ch]}
                </button>
              ))}
            </div>
          </Field>

          {/* Message template */}
          <Field label="Message template" required hint={PERSONALIZATION_HINTS}>
            <div className="relative">
              <textarea
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                rows={4}
                placeholder="Hi {{first_name}}, we miss you at Bare! …"
                className={`${inputCls} resize-none`}
              />
              <button
                onClick={handleAIDraft}
                disabled={drafting}
                className="absolute bottom-2 right-2 flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 bg-indigo-50 rounded px-2 py-1 disabled:opacity-50 transition-colors"
              >
                {drafting ? (
                  <Loader2 size={11} className="animate-spin" />
                ) : (
                  <Sparkles size={11} />
                )}
                {drafting ? "Drafting…" : "Draft with AI"}
              </button>
            </div>
            {draftNote && (
              <p className="text-xs text-indigo-500 mt-1">{draftNote}</p>
            )}
          </Field>

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
            {saving ? "Creating…" : "Create Campaign"}
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

const inputCls =
  "w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200";

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-gray-700">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

function Skeleton({ rows }: { rows: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />
      ))}
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
