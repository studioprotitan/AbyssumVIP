// c:\Developer\AbyssumVIP\nextapp\app\api\create-checkout-session\route.ts
// SSOT: Stripe Checkout Session — Abyssum VIP
// Compliance: Webhook-ready, idempotency key, env guard, API version locked

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// ── SSOT: Tier Prices (cents) ──────────────────────────────────────────────
const TIER_PRICES: Record<string, number> = {
  Standard: 999,
  Premium:  2999,
  Elite:    9999,
};

// ── Stripe Init with env guard ─────────────────────────────────────────────
const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) {
  throw new Error('[Abyssum] STRIPE_SECRET_KEY is not set in .env.local');
}

const stripe = new Stripe(secretKey, {
  apiVersion: '2024-06-20', // SSOT: locked version across all files
});

// ── POST /api/create-checkout-session ─────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tier, pilotId, idempotencyKey } = body as {
      tier: string;
      pilotId: string;
      idempotencyKey: string;
    };

    // Validate tier
    const unitAmount = TIER_PRICES[tier];
    if (!unitAmount) {
      return NextResponse.json(
        { error: `Unknown tier: ${tier}` },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!pilotId || !idempotencyKey) {
      return NextResponse.json(
        { error: 'pilotId and idempotencyKey are required' },
        { status: 400 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

    // Create session with idempotency key to prevent duplicates
    const session = await stripe.checkout.sessions.create(
      {
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              unit_amount: unitAmount,
              product_data: {
                name: `Abyssum VIP — ${tier}`,
                description: `Pilot Chassis NFT VIP Access: ${tier} Tier`,
                images: [], // Add branding URLs here when available
              },
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        // Webhook is the SSOT for fulfillment — success_url is display only
        success_url: `${appUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url:  `${appUrl}/cancel`,
        metadata: {
          pilotId,
          tier,
        },
      },
      {
        idempotencyKey, // Prevents duplicate sessions on retry
      }
    );

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    console.error('[Abyssum] Stripe session error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
