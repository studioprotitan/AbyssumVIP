// c:\Developer\AbyssumVIP\nextapp\app\api\webhook\route.ts
// MOAI Bridge: Stripe → Server fulfillment (checkout.session.completed)
// This is the DEFINITIVE trigger for VIP provisioning — not success_url

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Starting inventory seeded on VIP provisioning
const STARTING_INVENTORY = [
  { item_type: 'CORE_STONE', item_id: 'BLOODFLAKE_STONE_ALPHA', quantity: 3 },
  { item_type: 'CORE_STONE', item_id: 'BLOODFLAKE_STONE_BETA', quantity: 1 },
  { item_type: 'PART',       item_id: 'SMALL_GEAR',            quantity: 5 },
  { item_type: 'PART',       item_id: 'COPPER_SPROCKET',       quantity: 2 },
];

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) {
  throw new Error('[Abyssum] STRIPE_SECRET_KEY is not set in .env.local');
}

const stripe = new Stripe(secretKey);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig  = req.headers.get('stripe-signature') ?? '';

  let event: Stripe.Event;

  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } else {
      event = JSON.parse(body) as Stripe.Event;
      console.warn('[Abyssum] Webhook signature not verified — dev mode only');
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Webhook Error';
    console.error('[Abyssum] Webhook signature error:', message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  // ── MOAI Bridge: Broadcast fulfillment events ───────────────────────────
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    const pilotId = session.metadata?.pilotId;
    const tier    = session.metadata?.tier;

    if (!pilotId || !tier) {
      console.error('[Abyssum] Missing metadata in session:', session.id);
      return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
    }

    try {
      // ── Provision VIP tier for pilot ─────────────────────────────────
      const result = await provisionVIPTier(pilotId, session.id);
      if (!result.success) throw new Error(result.error);

      // MOAI.broadcast('VIP_PROVISIONED', { pilotId, tier, sessionId: session.id });
      console.log(`[Abyssum] VIP provisioned: pilotId=${pilotId} tier=${tier}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Provisioning failed';
      console.error('[Abyssum] Provisioning error:', message);
      // Return 500 so Stripe retries the webhook
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}

// ── Stub: replace with real provisioning logic ────────────────────────────
async function provisionVIPTier(
  walletAddress: string,
  stripeSessionId: string
) {
  console.log('[FREIGHT_LOAD_START] provisionVIPTier()', { walletAddress, stripeSessionId });

  try {
    // ── 1. WRITE PILOT RECORD ──────────────────────────────────────────
    const { data: pilot, error: pilotError } = await supabase
      .from('pilots')
      .upsert({
        wallet_address: walletAddress,
        stripe_session_id: stripeSessionId,
        vip_tier: true,
        test_pilot: true,
        test_pilot_class: 'GLITCH_GOBLIN',
        abex_balance: 500.00,
        forge_unlocked: true,
        abex_gdex_unlocked: true,
        golem_guide_unlocked: true,
        oracle_briefed: false,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'wallet_address' })
      .select()
      .single();

    if (pilotError) throw new Error(`Pilot write failed: ${pilotError.message}`);
    console.log('[NODE_LOAD] Pilot record written:', pilot.id);

    // ── 2. SEED STARTING INVENTORY ────────────────────────────────────
    const inventoryRows = STARTING_INVENTORY.map(item => ({
      pilot_id: pilot.id,
      ...item,
    }));

    const { error: invError } = await supabase
      .from('pilot_inventory')
      .upsert(inventoryRows, { onConflict: 'pilot_id,item_id' });

    if (invError) throw new Error(`Inventory seed failed: ${invError.message}`);
    console.log('[NODE_LOAD] Inventory seeded:', inventoryRows.length, 'items');

    // ── 3. ORACLE GENESIS BRIEF ───────────────────────────────────────
    const oraclePayload = {
      event: 'PILOT_GENESIS',
      pilot_id: pilot.id,
      wallet: walletAddress,
      tier: 'VIP',
      test_class: 'GLITCH_GOBLIN',
      abex_balance: 500.00,
      inventory_count: inventoryRows.length,
      unlocks: ['FORGE', 'ABEX_GDEX', 'GOLEM_GUIDE'],
      timestamp: new Date().toISOString(),
    };

    const { error: oracleError } = await supabase
      .from('oracle_intel')
      .insert({
        pilot_id: pilot.id,
        signal_type: 'GENESIS',
        payload: oraclePayload,
      });

    if (oracleError) throw new Error(`Oracle brief failed: ${oracleError.message}`);

    // Mark oracle briefed
    await supabase
      .from('pilots')
      .update({ oracle_briefed: true })
      .eq('id', pilot.id);

    console.log('[NODE_LOAD] Oracle genesis brief emitted');

    // ── 4. NFT MINT PLACEHOLDER ───────────────────────────────────────
    // TODO Phase 8.8: call ERC-1155 mint on Base Sepolia
    // Contract: 0x8be07421a4022a1008e0c331ddd24a0c451cfd1a
    console.log('[NODE_HOLD] NFT mint queued — Phase 8.8');

    // ── 5. FREIGHT_LOAD_COMPLETE ──────────────────────────────────────
    console.log('[FREIGHT_LOAD_COMPLETE] Pilot provisioned:', {
      pilot_id: pilot.id,
      wallet: walletAddress,
      vip: true,
      test_class: 'GLITCH_GOBLIN',
      abex_balance: 500.00,
      oracle: 'BRIEFED',
      nft: 'QUEUED',
    });

    return { success: true, pilot_id: pilot.id };

  } catch (err) {
    console.error('[NODE_LOAD_FAILED] provisionVIPTier()', err);
    return { success: false, error: String(err) };
  }
}
