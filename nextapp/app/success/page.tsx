import Link from 'next/link';

export default function SuccessPage() {
  return (
    <main style={{ background: '#0a0806', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'serif', color: '#e87c2a' }}>
      <h1 style={{ fontSize: '2rem', letterSpacing: '0.2em' }}>PILOT CHASSIS ACQUIRED</h1>
      <p style={{ color: '#c8932a', marginTop: '1rem' }}>Your Abyssum VIP access has been provisioned.</p>
      <p style={{ color: '#00d4c8', marginTop: '1rem' }}>RANK: GLITCH GOBLIN</p>
      <p style={{ color: '#c8932a' }}>FUEL: 500.00 ABEX</p>
      <p style={{ color: '#00d4c8' }}>FORGE LINK: ACTIVE</p>
      <Link href="/forge-confirm/" style={{ marginTop: '2rem', color: '#00d4c8', fontSize: '0.9rem' }}>
        Return to Base
      </Link>
    </main>
  );
}
