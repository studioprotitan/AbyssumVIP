import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

type GasSignal = 'STABLE' | 'ELEVATED' | 'CRITICAL';

interface GasState {
  safe: number;
  propose: number;
  fast: number;
  signal: GasSignal;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ETHERSCAN_KEY = process.env.ETHERSCAN_API_KEY || '';
const ETHERSCAN_API = `https://api.etherscan.io/v2/api?chainid=1&module=gastracker&action=gasoracle&apikey=${ETHERSCAN_KEY}`;

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get('wallet');

  let gasState: GasState = { safe: 0, propose: 0, fast: 0, signal: 'STABLE' };

  try {
    console.log('ETHERSCAN URL:', ETHERSCAN_API);
    const gasRes = await fetch(ETHERSCAN_API);
    const gasText = await gasRes.text();
    console.log('ETHERSCAN RAW:', gasText.slice(0, 200));
    const gasJson = JSON.parse(gasText);
    if (gasJson.status === '1') {
      const fast = parseFloat(gasJson.result.FastGasPrice);
      const signal: GasSignal = fast > 100 ? 'CRITICAL' : fast > 10 ? 'ELEVATED' : 'STABLE';
      gasState = {
        safe:    parseFloat(gasJson.result.SafeGasPrice),
        propose: parseFloat(gasJson.result.ProposeGasPrice),
        fast,
        signal,
      };
    } else {
      console.log('ETHERSCAN STATUS NOT 1:', gasJson.status, gasJson.message);
    }
  } catch (err) {
    console.error('ETHERSCAN ERROR:', err);
  }

  let pilot = null;
  if (wallet) {
    const { data } = await supabase
      .from('pilots')
      .select('id, wallet_address, test_pilot_class, abex_balance, forge_unlocked, oracle_briefed')
      .ilike('wallet_address', wallet)
      .single();
    pilot = data;
  }

  const integrity = gasState.signal === 'STABLE' ? 1.0 :
                    gasState.signal === 'ELEVATED' ? 0.6 : 0.2;

  let transmission = 'IDENTITY UNVERIFIED. FORGE NETWORK CANNOT AUTHENTICATE THIS SIGNAL.';
  if (pilot) {
    if (gasState.signal === 'CRITICAL') {
      transmission = `${pilot.test_pilot_class}... network under pressure. Gas at ${gasState.fast} GWEI. Hold or move — your call.`;
    } else if (!pilot.oracle_briefed) {
      transmission = `${pilot.test_pilot_class}. I know you're holding the card. ${pilot.abex_balance} ABEX loaded. The network has been watching since you arrived.`;
    } else {
      transmission = `${pilot.test_pilot_class}. Signal stable. Gas at ${gasState.safe} GWEI. You are cleared to deploy.`;
    }
  }

  return NextResponse.json({   pilot,
  gas: gasState,
  transmission,
  integrity,
  brae_voice_id: process.env.BRAE_VOICE_ID || null,
  elevenlabs_key: process.env.ElevenLabs_API_Key || null, });
}