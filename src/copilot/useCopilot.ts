import { useCopilotContext } from "./CopilotContext";

// Re-exports the context value as a convenience hook
// so consumers don't need to import both the context and hook separately.
export function useCopilot() {
  return useCopilotContext();
}
