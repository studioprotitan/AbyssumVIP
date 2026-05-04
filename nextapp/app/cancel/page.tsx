'use client';
import Link from 'next/link';

export default function CancelPage() {
  return (
    <main style={{
      background: '#0a0806',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'serif',
      color: '#e87c2a'
    }}>
      <h1 style={{ fontSize: '2rem', letterSpacing: '0.2em' }}>MISSION ABORTED</h1>
      <p style={{ color: '#888', marginTop: '1rem' }}>Checkout was cancelled. No charge was made.</p>
      <Link href="/" style={{ marginTop: '2rem', color: '#00d4c8', fontSize: '0.9rem' }}>
        Return to Base
      </Link>
    </main>
  );
}