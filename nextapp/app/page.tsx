'use client';

export default function Home() {
  async function handleEnter() {
    const res = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pilotId: 'GLITCH_GOBLIN_' + Date.now(), tier: 'Standard' }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  }

  return (
    <main style={{ background: '#0a0806', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'serif', color: '#e87c2a' }}>
      <h1 style={{ fontSize: '2.5rem', letterSpacing: '0.2em' }}>ABYSSUM VIP</h1>
      <p style={{ color: '#888', marginTop: '1rem' }}>Forge Network Access Portal</p>
      <button onClick={handleEnter} style={{ marginTop: '2rem', color: '#00d4c8', fontSize: '0.9rem', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'serif' }}>
        Enter the Forge
      </button>
    </main>
  );
}