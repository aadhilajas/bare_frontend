import { api } from "./client";

export interface CopilotMessage {
  role: "user" | "assistant";
  content: string;
}

export interface CopilotRequest {
  message: string;
  current_page: string;
  data_context: object;
  user_action?: string;
  /** Prior turns to give the model conversation memory within the session. */
  history?: CopilotMessage[];
}

export interface CopilotResponse {
  assistant_text: string;
  suggestions?: object;
}

export const copilotApi = {
  chat: (req: CopilotRequest) => api.post<CopilotResponse>("/copilot/chat", req),
};
