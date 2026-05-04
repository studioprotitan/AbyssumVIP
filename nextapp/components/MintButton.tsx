'use client';
// c:\Developer\AbyssumVIP\nextapp\components\MintButton.tsx
// Fires Stripe Checkout Session with idempotency key

import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

interface MintButtonProps {
  tier?: string;
  pilotId: string;
  label?: string;
  price?: string;
}

export default function MintButton({
  tier     = 'Standard',
  pilotId,
  label    = 'Mint Pilot Chassis',
  price    = '$29.99',
}: MintButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const handleMint = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/create-checkout-session', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier,
          pilotId,
          idempotencyKey: uuidv4(), // Prevents duplicate sessions
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.url) {
        throw new Error(data.error ?? 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      <button
        onClick={handleMint}
        disabled={loading}
        style={{
          background:    loading ? '#a0522d' : '#d2691e',
          color:         '#000',
          fontWeight:    'bold',
          fontSize:      '16px',
          padding:       '14px 32px',
          borderRadius:  '8px',
          border:        'none',
          cursor:        loading ? 'not-allowed' : 'pointer',
          minWidth:      '280px',
        }}
      >
        {loading ? 'Redirecting to Stripe...' : `${label} — ${price}`}
      </button>

      {error && (
        <p style={{ color: '#ff6b6b', fontSize: '13px', margin: 0 }}>
          {error}
        </p>
      )}
    </div>
  );
}
