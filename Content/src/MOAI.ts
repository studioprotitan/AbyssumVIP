// e:\AbyssumVIP\Data\core\MOAI.ts
export const MOAI = {
  agents: ["COPILOT", "CHATGPT", "GEMINI", "SENTINEL"] as const,

  broadcast(event: string, payload: unknown) {
    console.log(`[MOAI BROADCAST] ${event}`, payload);
    if (typeof window !== "undefined") {
      window.postMessage({ source: "MOAI", event, payload }, "*");
    }
  },
};