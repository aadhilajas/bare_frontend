import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { copilotApi, type CopilotMessage } from "@/api/copilot";
import { useLocation } from "react-router-dom";

interface CopilotContextValue {
  messages: CopilotMessage[];
  isLoading: boolean;
  /** Current page-level data context — set by each page on load */
  pageContext: object;
  setPageContext: (ctx: object) => void;
  sendMessage: (text: string, extraContext?: object) => Promise<void>;
  clearMessages: () => void;
}

const CopilotContext = createContext<CopilotContextValue | null>(null);

// Maximum number of prior messages sent as context on each request.
// 10 messages = 5 user/assistant exchanges.  Keeps the payload small while
// giving the model enough context to handle follow-up questions.
const MAX_HISTORY = 10;

export function CopilotProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pageContext, setPageContext] = useState<object>({});
  const location = useLocation();

  const sendMessage = useCallback(
    async (text: string, extraContext: object = {}) => {
      // Snapshot the conversation BEFORE appending the new user message.
      // React batches state updates, so `messages` still reflects the previous
      // state here — which is exactly the history we want to send to the model.
      const history = messages.slice(-MAX_HISTORY);

      setMessages((prev) => [...prev, { role: "user", content: text }]);
      setIsLoading(true);
      try {
        const res = await copilotApi.chat({
          message: text,
          current_page: location.pathname,
          data_context: { ...pageContext, ...extraContext },
          history,
        });
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: res.assistant_text },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Sorry, I couldn't reach the AI service right now.",
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [location.pathname, pageContext, messages]
  );

  const clearMessages = useCallback(() => setMessages([]), []);

  return (
    <CopilotContext.Provider
      value={{
        messages,
        isLoading,
        pageContext,
        setPageContext,
        sendMessage,
        clearMessages,
      }}
    >
      {children}
    </CopilotContext.Provider>
  );
}

export function useCopilotContext(): CopilotContextValue {
  const ctx = useContext(CopilotContext);
  if (!ctx) throw new Error("useCopilotContext must be used within CopilotProvider");
  return ctx;
}
