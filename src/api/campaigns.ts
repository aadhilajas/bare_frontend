import { api } from "./client";

export interface Campaign {
  id: string;
  name: string;
  segment_id: string;
  channel: "whatsapp" | "sms" | "email" | "rcs";
  message_template: string;
  status: "draft" | "sending" | "sent";
  ai_reasoning: string | null;
  created_at: string;
  sent_at: string | null;
}

export interface CampaignStats {
  total_sent: number;
  delivered: number;
  failed: number;
  opened: number;
  read: number;
  clicked: number;
  delivery_rate: number;
  open_rate: number;
  click_rate: number;
}

export interface Message {
  id: string;
  campaign_id: string;
  customer_id: string;
  channel: string;
  personalised_text: string;
  status: "queued" | "sent" | "delivered" | "opened" | "read" | "clicked" | "failed";
  sent_at: string | null;
  delivered_at: string | null;
  opened_at: string | null;
  read_at: string | null;
  clicked_at: string | null;
  failed_reason: string | null;
}

export interface ChannelStats {
  channel: string;
  campaigns: number;
  total_sent: number;
  delivery_rate: number;
  open_rate: number;
  click_rate: number;
}

export interface AggregateStats {
  total_sent: number;
  delivered: number;
  opened: number;
  read: number;
  clicked: number;
  failed: number;
  delivery_rate: number;
  open_rate: number;
  click_rate: number;
  by_channel: ChannelStats[];
}

export const campaignsApi = {
  list: () => api.get<Campaign[]>("/campaigns"),
  get: (id: string) => api.get<Campaign & { stats: CampaignStats }>(`/campaigns/${id}`),
  create: (data: Omit<Campaign, "id" | "created_at" | "sent_at" | "status">) =>
    api.post<Campaign>("/campaigns", data),
  send: (id: string) => api.post<Campaign>(`/campaigns/${id}/send`, {}),
  messages: (id: string) => api.get<Message[]>(`/campaigns/${id}/messages`),
  aggregateStats: () => api.get<AggregateStats>("/campaigns/stats"),
};
