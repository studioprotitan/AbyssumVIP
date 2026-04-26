'use client';

import { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import styles from './page.module.css';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleMintCheckout() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pilotId: '0x3a...Ee20', tier: 'Standard' }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Checkout failed');
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  }

  return (
    <main className={styles.main}>
      <h1 className={styles.title}>ABYSSUM VIP</h1>
      <ConnectButton />
      <button
        className={styles.mintButton}
        onClick={handleMintCheckout}
        disabled={loading}
        style={{ opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
      >
        {loading ? 'Redirecting to Stripe…' : 'Mint Pilot Chassis — $29.99'}
      </button>
      {error && (
        <p style={{ color: '#e87c2a', fontSize: '0.875rem', marginTop: '-1rem' }}>
          {error}
        </p>
      )}
    </main>
  );
}
