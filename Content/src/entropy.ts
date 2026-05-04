// e:\AbyssumVIP\Data\core\entropy.ts
import { SENTINEL } from "./SENTINEL";

let entropy = 0;
let resetTimer: ReturnType<typeof setTimeout> | null = null;

export function throttleEntropy(): boolean {
  entropy++;

  // Auto-reset after 2s of no mutations — prevents permanent lock
  if (resetTimer) clearTimeout(resetTimer);
  resetTimer = setTimeout(() => { entropy = 0; }, 2000);

  if (entropy > 10) {
    console.warn("⚠️ ENTROPY LIMIT REACHED — blocking execution");
    SENTINEL.alert("ENTROPY_OVERFLOW", { entropy });
    return false;
  }
  return true;
}

export function resetEntropy() {
  entropy = 0;
  if (resetTimer) clearTimeout(resetTimer);
}