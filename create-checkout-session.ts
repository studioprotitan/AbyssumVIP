import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

// Next.js loads .env.local automatically — no dotenv needed
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-06-20',
});

// Tier pricing map — extend as you add tiers
const TIER_PRICES: Record<string, number> = {
  Standard: 2999,   // $29.99 in cents
  Premium:  4999,   // $49.99 — add when ready
  Elite:    9999,   // $99.99 — add when ready
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { pilotId, tier } = req.body as { pilotId: string; tier: string };

  if (!pilotId || !tier) {
    return res.status(400).json({ error: 'Missing pilotId or tier' });
  }

  const unitAmount = TIER_PRICES[tier];
  if (!unitAmount) {
    return res.status(400).json({ error: `Unknown tier: ${tier}` });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: unitAmount,
            product_data: {
              name: `ABYSSUM VIP — Pilot Chassis (${tier})`,
              description: `Pilot ID: ${pilotId}`,
              images: [], // Add your NFT preview image URL here when ready
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        pilotId,
        tier,
      },
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${baseUrl}/cancel`,
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    console.error('[Stripe Checkout Error]', message);
    return res.status(500).json({ error: message });
  }
}
