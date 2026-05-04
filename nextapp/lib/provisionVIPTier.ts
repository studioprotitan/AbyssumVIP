import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function provisionVIPTier(
  walletAddress: string,
  stripeSessionId: string
) {
  const { data, error } = await supabase
    .from('pilots')
    .upsert(
      {
        wallet_address: walletAddress,
        stripe_session_id: stripeSessionId,
        vip_tier: true,
        test_pilot: true,
        test_pilot_class: 'GLITCH_GOBLIN',
        abex_balance: 500.00,
        forge_unlocked: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'wallet_address' }
    )
    .select()
    .single()

  if (error) {
    console.error('[provisionVIPTier] Supabase error:', error)
    throw error
  }

  console.log('[provisionVIPTier] Pilot provisioned:', data.id)
  return data
}