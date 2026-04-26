'use client';

import { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import styles from './page.module.css';

export default function Home() {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError]     = useState<string | null>(null);

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
    } finally {
      setLoading(false);
    }
  }


  return (
    <main className={styles.main}>
      <h1 className={styles.title}>ABYSSUM VIP</h1>
      <ConnectButton />
      <button
        type="button"
        className={`${styles.mintButton} ${loading ? styles.buttonLoading : ''}`}
        onClick={handleMintCheckout}
        disabled={loading}
      >
        {loading ? 'Redirecting to Stripe…' : 'Mint Pilot Chassis — $29.99'}
      </button>
      {error && <p className={styles.error}>{error}</p>}
    </main>
  );
}