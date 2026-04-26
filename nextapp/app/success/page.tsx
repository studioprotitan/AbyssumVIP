'use client';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function SuccessContent() {
  const params = useSearchParams();
  const sessionId = params.get('session_id');
  
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
      <h1 style={{ fontSize: '2rem', letterSpacing: '0.2em' }}>PILOT CHASSIS ACQUIRED</h1>
      <p style={{ color: '#c8932a', marginTop: '1rem' }}>Your Abyssum VIP access has been provisioned.</p>
      {sessionId && (
        <p style={{ color: '#555', fontSize: '0.75rem', marginTop: '2rem' }}>
          Session: {sessionId.slice(0, 24)}...
        </p>
      )}
      <a href="/" style={{ marginTop: '2rem', color: '#00d4c8', fontSize: '0.9rem' }}>
        Return to Base
      </a>
    </main>
  );
}

export default function SuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  );
}
