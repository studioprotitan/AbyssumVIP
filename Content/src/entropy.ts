// ENTROPY THROTTLER — CORS pre-flight warm-up
// Fires before any babylon/GLB fetch to resolve CORS handshake early
// Wired to Glitch Goblin as first-contact trigger

export async function entropyThrottle(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: 'HEAD', mode: 'cors' });
    return res.ok;
  } catch {
    return false;
  }
}

export async function warmAssetGateway(paths: string[]): Promise<void> {
  await Promise.allSettled(paths.map(p => entropyThrottle(p)));
}