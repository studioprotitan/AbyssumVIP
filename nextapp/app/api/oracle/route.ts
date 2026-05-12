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
const ETHERSCAN_API = `https://api.etherscan.io/v2/api?chainid=1&module=gastracker&action=gasoracle&apikey=${process.env.ETHERSCAN_API_KEY}`;

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get('wallet');

  let gasState: GasState = { safe: 0, propose: 0, fast: 0, signal: 'CRITICAL' };

  try {
    console.log('ETHERSCAN URL:', ETHERSCAN_API);
    const gasRes = await fetch(ETHERSCAN_API);
    const gasJson = await gasRes.json();
    if (gasJson.status === '1') {
      const fast = parseInt(gasJson.result.FastGasPrice);
      const signal: GasSignal = fast > 100 ? 'CRITICAL' : fast > 50 ? 'ELEVATED' : 'STABLE';
      gasState = {
        safe:    parseInt(gasJson.result.SafeGasPrice),
        propose: parseInt(gasJson.result.ProposeGasPrice),
        fast,
        signal,
      };
    }
  } catch (_err) {
    console.error('ETHERSCAN FETCH ERROR:', _err);
  }

  let pilot = null;
  if (wallet) {
    const { data } = await supabase
      .from('pilots')
      .select('id, wallet_address, test_pilot_class, abex_balance, forge_unlocked, oracle_briefed')
      .eq('wallet_address', wallet)
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

  return NextResponse.json({ pilot, gas: gasState, transmission, integrity });
}