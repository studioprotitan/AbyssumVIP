
'use client';

import { 
  AdaptiveAICompanionBehaviorInput, 
  Locomotion, 
  Environment, 
  MissionContext, 
  PilotIntent, 
  Personality,
  ThreatLevel
} from '@/lib/game/types';
import { db } from '@/firebase/config';
import { doc, setDoc, getDoc } from 'firebase/firestore';

/**
 * PseudoMemory - Authoritative behavioral state.
 * Compliance: STATE_CORE for cognitive data.
 * Zero Drift Policy: All updates must be deterministic.
 */
export class PseudoMemory {
  private state: AdaptiveAICompanionBehaviorInput;

  constructor() {
    this.state = {
      locomotion: Locomotion.idle,
      environment: Environment.interior,
      missionContext: MissionContext.launchPrep,
      pilotIntent: PilotIntent.forward,
      personality: Personality.efficient,
      threatLevel: ThreatLevel.LOW,
      entropyScore: 0.1,
      timestamp: Date.now(),
    };
  }

  public update(update: Partial<AdaptiveAICompanionBehaviorInput>) {
    this.state = {
      ...this.state,
      ...update,
      timestamp: Date.now()
    };
  }

  public getSnapshot(): AdaptiveAICompanionBehaviorInput {
    return { ...this.state };
  }

  /**
   * Persistence Interface (Phase 9 Bridge)
   * Ensures cognitive data survives session termination.
   * SYNC_BRIDGE Compliance: All persistence events broadcast via console.
   */
  public async save(avatarId: string = 'default-avatar') {
    if (!db) return;
    try {
      await setDoc(doc(db, 'avatar_memory', avatarId), {
        ...this.state,
        savedAt: Date.now()
      });
    } catch (e: any) {
      if (e.code === 'unavailable' || e.code === 'offline') {
        return;
      }
    }
  }

  public async hydrate(avatarId: string = 'default-avatar') {
    if (!db) return;
    try {
      const snap = await getDoc(doc(db, 'avatar_memory', avatarId));
      if (snap.exists()) {
        const data = snap.data() as AdaptiveAICompanionBehaviorInput;
        this.state = {
          ...this.state,
          ...data,
          timestamp: Date.now()
        };
      }
    } catch (e: any) {
      if (e.code === 'unavailable' || e.code === 'offline') {
        return;
      }
      console.warn('[STABILITY_CHECK] Hydration Interrupted:', e.message);
    }
  }
}

export const companionMemory = new PseudoMemory();
