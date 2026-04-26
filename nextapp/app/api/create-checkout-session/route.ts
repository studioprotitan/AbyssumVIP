import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const TIER_PRICES: Record<string, number> = {
  Standard: 2999,
  Premium:  4999,
  Elite:    9999,
};

export async function POST(req: NextRequest) {
  try {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) throw new Error('STRIPE_SECRET_KEY not set');
    const stripe = new Stripe(secretKey);

    const { pilotId, tier } = await req.json() as { pilotId: string; tier: string };
    if (!pilotId || !tier) {
      return NextResponse.json({ error: 'Missing pilotId or tier' }, { status: 400 });
    }

    const unitAmount = TIER_PRICES[tier];
    if (!unitAmount) {
      return NextResponse.json({ error: 'Unknown tier: ' + tier }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: unitAmount,
            product_data: {
              name: 'ABYSSUM VIP - Pilot Chassis (' + tier + ')',
              description: 'Pilot ID: ' + pilotId,
            },
          },
          quantity: 1,
        },
      ],
      metadata: { pilotId, tier },
      success_url: baseUrl + '/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url:  baseUrl + '/cancel',
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    console.error('[Stripe Checkout Error]', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
