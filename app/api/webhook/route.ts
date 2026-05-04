import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { provisionVIPTier } from '@/lib/provisionVIPTier'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    console.error('[webhook] Signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    const walletAddress = session.metadata?.wallet_address
    const sessionId = session.id

    if (!walletAddress) {
      console.error('[webhook] No wallet_address in session metadata')
      return NextResponse.json({ error: 'Missing wallet' }, { status: 400 })
    }

    try {
      await provisionVIPTier(walletAddress, sessionId)
      console.log('[webhook] VIP provisioned for:', walletAddress)
    } catch (err) {
      console.error('[webhook] provisionVIPTier failed:', err)
      return NextResponse.json({ error: 'Provision failed' }, { status: 500 })
    }
  }

  return NextResponse.json({ received: true })
}