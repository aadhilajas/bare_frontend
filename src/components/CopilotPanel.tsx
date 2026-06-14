import { useEffect, useRef, useState } from "react";
import { useCopilot } from "@/copilot/useCopilot";
import { Sparkles, Send, Trash2 } from "lucide-react";

const WELCOME =
  "Hi! I'm your Bare co-pilot. Ask me about your customers, segments, or campaigns — I can draft messages, explain segments, or suggest next actions.";

const CHIPS = [
  "Explain my top segment",
  "Draft a WhatsApp campaign message",
  "Summarise campaign performance",
];

export default function CopilotPanel() {
  const { messages, sendMessage, isLoading, clearMessages } = useCopilot();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    sendMessage(text);
  };

  return (
    <aside className="w-80 shrink-0 border-l border-gray-200 bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Sparkles size={15} className="text-indigo-500" />
          <span className="text-sm font-semibold text-gray-900">AI Co-Pilot</span>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearMessages}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="Clear chat"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <>
            <p className="text-xs text-gray-400 leading-relaxed">{WELCOME}</p>
            <div className="flex flex-col gap-1.5 pt-1">
              {CHIPS.map((chip) => (
                <button
                  key={chip}
                  onClick={() => {
                    setInput("");
                    sendMessage(chip);
                  }}
                  disabled={isLoading}
                  className="text-left text-xs text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-lg px-3 py-2 transition-colors disabled:opacity-50"
                >
                  {chip}
                </button>
              ))}
            </div>
          </>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`text-sm rounded-xl px-3 py-2 leading-relaxed whitespace-pre-wrap ${
              msg.role === "user"
                ? "bg-indigo-50 text-indigo-900 ml-6 self-end"
                : "bg-gray-100 text-gray-800 mr-6"
            }`}
          >
            {msg.role === "assistant" && (
              <span className="block text-[10px] text-gray-400 mb-1 font-medium uppercase tracking-wide">
                Co-Pilot
              </span>
            )}
            {msg.content}
          </div>
        ))}
        {isLoading && (
          <div className="bg-gray-100 rounded-xl px-3 py-2 mr-6">
            <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide block mb-1">
              Co-Pilot
            </span>
            <span className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-200">
        <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-indigo-300 bg-white">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask anything…"
            className="flex-1 text-sm bg-transparent outline-none placeholder:text-gray-400"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="text-indigo-500 disabled:text-gray-300 transition-colors hover:text-indigo-700"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}
