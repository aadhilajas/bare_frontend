import { api } from "./client";

export interface FilterCondition {
  field: string;
  operator: string;
  value: string | number;
}

/** As stored in DB and returned by GET /api/segments — filters is a JSON string */
export interface Segment {
  id: string;
  name: string;
  description: string;
  filters: string;              // JSON string — JSON.parse() → FilterCondition[]
  match_mode: "ALL" | "ANY";
  customer_count: number;
  ai_reasoning: string | null;
  created_at: string;
}

/** Returned by POST /api/segments/interpret — filters already parsed */
export interface InterpretResponse {
  name: string;
  filters: FilterCondition[];   // already parsed array
  match_mode: "ALL" | "ANY";
  explanation: string;
}

export interface SegmentCreate {
  name: string;
  description?: string;
  filters: FilterCondition[];
  match_mode: "ALL" | "ANY";
  ai_reasoning?: string;
}

export interface PreviewCustomer {
  id: string;
  name: string;
  city: string;
  total_spend: number;
  total_orders: number;
}

export interface SegmentPreview {
  count: number;
  customers: PreviewCustomer[];
}

/** Parse the filters JSON string from a Segment into a FilterCondition array */
export function parseFilters(filtersJson: string): FilterCondition[] {
  try {
    const parsed = JSON.parse(filtersJson);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export const segmentsApi = {
  list: () => api.get<Segment[]>("/segments"),
  get: (id: string) => api.get<Segment>(`/segments/${id}`),
  create: (data: SegmentCreate) => api.post<Segment>("/segments", data),
  interpret: (intentText: string, context?: object) =>
    api.post<InterpretResponse>("/segments/interpret", {
      intent_text: intentText,
      context,
    }),
  preview: (filters: FilterCondition[], matchMode: "ALL" | "ANY") =>
    api.post<SegmentPreview>("/segments/preview", {
      filters,
      match_mode: matchMode,
    }),
};
