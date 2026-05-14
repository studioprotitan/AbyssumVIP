/**
 * BraeOSU.ts
 * OSU-Unit-A -- Brae Grindstone Behavioral Brain
 * Phase 9 -- Intelligence Layer
 *
 * Canon voice (Narrative Design Document):
 *   Practical. Sardonic. Tired in the way of someone who spent ten years
 *   fixing broken machines. Post-awakening: alertness underneath the
 *   tiredness. Not awe. Adaptation. "Guess we're doing this."
 *
 * Brae != Oracle.
 *   Oracle speaks to the PLAYER (Fourth Wall broken -- addresses the person).
 *   Brae speaks to the SYSTEM (in-world operative -- addresses what she observes).
 *   Two voices. Two channels. One Forge Network.
 *
 * Log terminal color: ORANGE (#e07a20)
 * Oracle terminal color: TEAL (#00c8a8)
 */

import { MOAI } from './MOAI';
import { SENTINEL } from './SENTINEL';

// -- TYPES ------------------------------------------------------------------

export type GasSignal = 'STABLE' | 'ELEVATED' | 'CRITICAL';

export type BraeEventType =
  | 'PILOT_AUTHENTICATED'
  | 'PILOT_UNVERIFIED'
  | 'GAS_STABLE'
  | 'GAS_ELEVATED'
  | 'GAS_CRITICAL'
  | 'CLIP_CHANGED'
  | 'DEPLOY_ARMED'
  | 'DEPLOY_TRIGGERED'
  | 'WALLET_CONNECTED'
  | 'WALLET_DISCONNECTED'
  | 'STAGE_LOADED'
  | 'GLB_FAILED'
  | 'BOOT';

export interface BraeEvent {
  type: BraeEventType;
  payload?: Record<string, unknown>;
}

export interface BraeState {
  pilotVerified: boolean;
  pilotClass: string | null;
  gasSignal: GasSignal;
  lastClip: string | null;
  sessionActive: boolean;
  transmissionCount: number;
}

// -- TRANSMISSION LIBRARY ---------------------------------------------------
// Each event maps to an array of possible responses.
// Brae rotates through them -- she doesn't repeat herself immediately.

const TRANSMISSIONS: Record<BraeEventType, string[]> = {
  BOOT: [
    'Systems nominal. Scanning.',
    'Network is up. Running diagnostics.',
  ],
  PILOT_AUTHENTICATED: [
    'Pilot on record. I see you.',
    "Record matches. You're cleared to the stage.",
    "I've got your file. Let's see what you do with it.",
  ],
  PILOT_UNVERIFIED: [
    'No record found. Complete onboarding to authenticate.',
    "Signal unverified. The network doesn't have you yet.",
    "I can't pull a file that isn't there.",
  ],
  WALLET_CONNECTED: [
    'Wallet linked. Querying the network.',
    'Connection established. Running pilot check.',
    'I see the address. Give me a second.',
  ],
  WALLET_DISCONNECTED: [
    'Signal cleared. Forge link dropped.',
    'You stepped back. Stage is cold.',
    'Disconnected. Everything resets.',
  ],
  GAS_STABLE: [
    'Gas is nominal. Deploy window is clean.',
    'Network load is low. Good conditions.',
    'Forge costs are reasonable. Your call.',
  ],
  GAS_ELEVATED: [
    'Load is rising. Deploy window is narrowing.',
    'Gas is elevated. Pick your moment.',
    "Network is busy. If you're moving, move.",
  ],
  GAS_CRITICAL: [
    "Gas is high. Forge costs are up. I've worked in worse.",
    'Network is under pressure. Hold or move -- your call.',
    'Critical load. Not ideal. Not impossible.',
  ],
  CLIP_CHANGED: [
    'Animation queued.',
    'Sequence loaded.',
    "That one's cleaner than it looks.",
    'Running the clip.',
    'Good form on the wall jump.',
    'Death sequence loads clean. Useful.',
    'Sprint A is the one you want in the field.',
  ],
  DEPLOY_ARMED: [
    "MINT TO DEPLOY is armed. You're cleared when you're ready.",
    'Stage is set. The network is waiting.',
    'Ready state confirmed. Your move.',
  ],
  DEPLOY_TRIGGERED: [
    'Deploying. Forge network is processing.',
    'Mint initiated. Standing by.',
    'Transaction queued. Should be clean.',
  ],
  STAGE_LOADED: [
    'Hype Stage is live. Environment confirmed.',
    "Stage environment loaded. We're on.",
    'Stage is up. Forge viewers are active.',
  ],
  GLB_FAILED: [
    'GLB load error. Check the asset proxy.',
    "Model didn't come through. Proxy issue or CDN.",
    "Load failed. I'll run on the fallback list.",
  ],
};

// -- BRAE OSU CLASS ---------------------------------------------------------

export class BraeOSU {
  private static instance: BraeOSU;
  private state: BraeState;
  private transmissionIndex: Partial<Record<BraeEventType, number>>;
  private onTransmit: ((text: string, type: BraeEventType) => void) | null;

  private constructor() {
    this.state = {
      pilotVerified: false,
      pilotClass: null,
      gasSignal: 'STABLE',
      lastClip: null,
      sessionActive: false,
      transmissionCount: 0,
    };
    this.transmissionIndex = {};
    this.onTransmit = null;
  }

  public static getInstance(): BraeOSU {
    if (!BraeOSU.instance) {
      BraeOSU.instance = new BraeOSU();
    }
    return BraeOSU.instance;
  }

  /**
   * Register the callback that delivers Brae's transmissions
   * to the UI log terminal.
   * In ForgeConfirm, this writes to the OSU CHANNEL row in ORANGE.
   */
  public onTransmission(
    callback: (text: string, type: BraeEventType) => void
  ): void {
    this.onTransmit = callback;
  }

  /**
   * Primary event handler.
   * All HUD events route through here.
   */
  public handle(event: BraeEvent): void {
    this.updateState(event);
    const text = this.selectTransmission(event.type);
    if (text) {
      this.transmit(text, event.type);
    }
    MOAI.broadcast('BRAE_EVENT', { type: event.type, payload: event.payload });
    SENTINEL.register('BRAE_OSU_EVENT', `${event.type}`);
  }

  /**
   * Update internal state based on incoming event.
   */
  private updateState(event: BraeEvent): void {
    switch (event.type) {
      case 'PILOT_AUTHENTICATED':
        this.state.pilotVerified = true;
        this.state.pilotClass = (event.payload?.pilotClass as string) || null;
        this.state.sessionActive = true;
        break;
      case 'PILOT_UNVERIFIED':
      case 'WALLET_DISCONNECTED':
        this.state.pilotVerified = false;
        this.state.pilotClass = null;
        break;
      case 'GAS_STABLE':
        this.state.gasSignal = 'STABLE';
        break;
      case 'GAS_ELEVATED':
        this.state.gasSignal = 'ELEVATED';
        break;
      case 'GAS_CRITICAL':
        this.state.gasSignal = 'CRITICAL';
        break;
      case 'CLIP_CHANGED':
        this.state.lastClip = (event.payload?.clipName as string) || null;
        break;
    }
  }

  /**
   * Select a transmission from the library.
   * Rotates through options so Brae doesn't repeat immediately.
   * Not every event triggers a transmission -- Brae uses silence.
   */
  private selectTransmission(type: BraeEventType): string | null {
    const options = TRANSMISSIONS[type];
    if (!options || options.length === 0) return null;

    // Clip changes only transmit 1 in 3 times -- Brae doesn't narrate every move
    if (type === 'CLIP_CHANGED' && Math.random() > 0.33) return null;

    // Gas signal only transmits on change, not on every query
    if (
      (type === 'GAS_STABLE' || type === 'GAS_ELEVATED' || type === 'GAS_CRITICAL')
      && this.state.transmissionCount < 2
    ) return null;

    const currentIndex = this.transmissionIndex[type] ?? 0;
    const text = options[currentIndex % options.length];
    this.transmissionIndex[type] = (currentIndex + 1) % options.length;
    this.state.transmissionCount++;
    return text;
  }

  /**
   * Deliver the transmission to the UI.
   */
  private transmit(text: string, type: BraeEventType): void {
    if (this.onTransmit) {
      this.onTransmit(text, type);
    }
    // Also available as MOAI broadcast for other commanders to read
    MOAI.broadcast('BRAE_TRANSMISSION', { text, type });
  }

  /**
   * Read current state (for debugging or Oracle cross-reference).
   */
  public getState(): Readonly<BraeState> {
    return { ...this.state };
  }
}

// -- SINGLETON EXPORT -------------------------------------------------------

export const globalBraeOSU = BraeOSU.getInstance();

// -- FORGE CONFIRM WIRING INSTRUCTIONS --------------------------------------
//
// In ForgeConfirm_v8.html, add this after the Oracle query section:
//
// Step 1 -- Import (if using as module) or inline the class.
//
// Step 2 -- Register the UI callback:
//   globalBraeOSU.onTransmission(function(text, type) {
//     var braeEl = document.getElementById('brae-channel');
//     if (braeEl) braeEl.textContent = 'OSU CHANNEL -- BRAE: ' + text;
//     log('BRAE: ' + text, 'brae');  // 'brae' class = orange in CSS
//   });
//
// Step 3 -- Fire events from existing hooks:
//
//   On wallet connect success:
//     globalBraeOSU.handle({ type: 'WALLET_CONNECTED' });
//
//   On Oracle pilot auth confirmed:
//     globalBraeOSU.handle({
//       type: 'PILOT_AUTHENTICATED',
//       payload: { pilotClass: oracle.pilot.test_pilot_class }
//     });
//
//   On Oracle pilot null:
//     globalBraeOSU.handle({ type: 'PILOT_UNVERIFIED' });
//
//   On gas signal change (compare previous vs current):
//     if (oracle.gas.signal === 'STABLE')   globalBraeOSU.handle({ type: 'GAS_STABLE' });
//     if (oracle.gas.signal === 'ELEVATED') globalBraeOSU.handle({ type: 'GAS_ELEVATED' });
//     if (oracle.gas.signal === 'CRITICAL') globalBraeOSU.handle({ type: 'GAS_CRITICAL' });
//
//   On clip change (in playClip function):
//     globalBraeOSU.handle({
//       type: 'CLIP_CHANGED',
//       payload: { clipName: activeGroup.name }
//     });
//
//   On ALL GREEN (in onAllGreen function):
//     globalBraeOSU.handle({ type: 'DEPLOY_ARMED' });
//
//   On GLB load error:
//     globalBraeOSU.handle({ type: 'GLB_FAILED' });
//
//   On boot:
//     globalBraeOSU.handle({ type: 'BOOT' });
//
// Step 4 -- Add CSS class 'brae' to log terminal styles:
//   .log-line.brae { color: #e07a20; }  /* forge orange */
//
// Step 5 -- Add the OSU CHANNEL display element in right panel HTML:
//   <div id="brae-channel" class="brae-channel">OSU CHANNEL -- BRAE: --</div>
//
// -- END OF WIRING INSTRUCTIONS ---------------------------------------------

// -- ORACLEAI.ts INTEGRATION ------------------------------------------------
//
// BraeOSU is scaffolded for OracleAI.ts (Content/src/OracleAI.ts).
// When the OSU behavioral layer is added to OracleAI.ts in Phase 9:
//
// import { globalBraeOSU } from './BraeOSU';
//
// In the OracleAI class, wire events from the existing oracle query loop:
//
//   onGasResult(gas: GasState) {
//     const sigMap = { STABLE: 'GAS_STABLE', ELEVATED: 'GAS_ELEVATED', CRITICAL: 'GAS_CRITICAL' };
//     const eventType = sigMap[gas.signal];
//     if (eventType) globalBraeOSU.handle({ type: eventType as BraeEventType });
//   }
//
//   onPilotAuthenticated(pilot: PilotRecord) {
//     globalBraeOSU.handle({
//       type: 'PILOT_AUTHENTICATED',
//       payload: { pilotClass: pilot.test_pilot_class }
//     });
//   }
//
// BraeOSU.handle() already calls MOAI.broadcast and SENTINEL.register.
// No additional wiring to MOAI or SENTINEL is needed from OracleAI.
//
// -- ELEVENLABS VOICE LAYER -------------------------------------------------
//
// When ElevenLabs voice is activated (Phase 9 -- OSU voice milestone):
//
// 1. Add to Vercel env vars:
//      ELEVENLABS_API_KEY=your_key
//      BRAE_VOICE_ID=your_selected_voice_id
//
// 2. Echo from /api/oracle/route.ts in the response object:
//      brae_voice_id: process.env.BRAE_VOICE_ID,
//      elevenlabs_key: process.env.ELEVENLABS_API_KEY,
//
// 3. In ForgeConfirm_v8.html, inside the oracle fetch success block:
//      if (oracle.brae_voice_id) BraeOSU.setCredentials(oracle.brae_voice_id, oracle.elevenlabs_key);
//
// 4. BraeOSU.ts voice layer (future TypeScript port):
//    Add private _elevenLabsKey and _braeVoiceId to BraeState.
//    Add async speakElevenLabs(text: string): Promise<void> using fetch to
//    https://api.elevenlabs.io/v1/text-to-speech/{voiceId}/stream
//    Model: eleven_turbo_v2. Settings: stability 0.55, similarity 0.75, style 0.15.
//
// -- OSU INTERNAL CLOCK (CANON LOCKED) --------------------------------------
//
// Per Phase 9 spec, OSU-Unit-A carries an internal clock:
//   genesis_timestamp:  immutable at construction (Date.now() in constructor)
//   last_signal_at:     updated on every handle() call
//   lifecycle_stage:    'ACTIVE' | 'DEGRADED' | 'REFORGE_READY'
//
// Add to BraeState when internal clock milestone is reached:
//   genesisTimestamp: number;   // set once in constructor, never mutated
//   lastSignalAt: number;       // updated in handle()
//   lifecycleStage: 'ACTIVE' | 'DEGRADED' | 'REFORGE_READY';
//
// -- PHASE 9 HANDOFF --------------------------------------------------------
//
// STATUS:        FILED -- canonical source for BraeOSU behavioral brain
// FILE TARGET:   Content/src/BraeOSU.ts
// COMMIT AFTER:  git add Content/src/BraeOSU.ts
//                git commit -m "fix: BraeOSU.ts -- sanitize encoding, straight quotes"
//                git push origin main
//                (run from C:\Developer\AbyssumVIP\nextapp)
//
// WHAT IS LIVE:  BraeOSU behavioral layer is wired into ForgeConfirm_v8.html
//                as a vanilla JS IIFE (commit 4720062 -- main -- Vercel deployed).
//                This .ts file is the canonical TypeScript source for the same
//                brain, ready to be imported into OracleAI.ts when Phase 9
//                OSU behavioral layer is formally added.
//
// NEXT ACTION:   Select Brae's ElevenLabs voice. Return BRAE_VOICE_ID to HQ.
//                Wire setCredentials() call in ForgeConfirm oracle fetch block.
//                Then Brae speaks.
//
// MOAI SIGNAL:   HOLDING
// -- END OF PHASE 9 HANDOFF -------------------------------------------------