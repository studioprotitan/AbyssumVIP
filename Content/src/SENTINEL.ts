// e:\AbyssumVIP\Data\core\SENTINEL.ts
export const SENTINEL = {
  logs: [] as Array<{ event: string; source: string; time: number }>,

  register(event: string, source: string) {
    const entry = { event, source, time: Date.now() };
    this.logs.push(entry);
    console.log("[SENTINEL]", entry);
    this.detectAnomaly(entry);
  },

  detectAnomaly: function(
    this: typeof SENTINEL,
    entry: { event: string; source: string }
  ) {
    const conflict = this.logs.filter(
      (log) => log.event === entry.event && log.source !== entry.source
    );
    if (conflict.length > 1) {
      this.alert("MULTI-AI CONFLICT", conflict);
    }
  },

  alert(type: string, data: unknown) {
    console.warn(`[SENTINEL ALERT] ${type}`, data);
    if (typeof window !== "undefined") {
      window.postMessage({ source: "SENTINEL", type, data }, "*");
    }
  },
};