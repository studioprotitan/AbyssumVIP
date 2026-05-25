// FORGE ENGINE — CORS pre-flight + gateway warm-up
// Evolved from Entropy Throttler — Phase 9.0
// Fires before any Babylon/GLB fetch to resolve CORS handshake early
// Wired to Glitch Goblin as first-contact trigger

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? '';

const FORGE_GATEWAY_PATHS = [
  '/forge-confirm/',
  '/api/create-checkout-session',
  '/success/',
];

export async function forgeProbe(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: 'HEAD', mode: 'cors' });
    return res.ok;
  } catch {
    return false;
  }
}

export async function forgeEngineWarmUp(): Promise<void> {
  const targets = FORGE_GATEWAY_PATHS.map(p => `${BASE_URL}${p}`);
  await Promise.allSettled(targets.map(forgeProbe));
}
