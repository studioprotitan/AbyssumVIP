
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
 * Compliance: SSOT for cognitive data.
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
   */
  public async save(avatarId: string = 'default-avatar') {
    try {
      await setDoc(doc(db, 'avatar_memory', avatarId), {
        ...this.state,
        savedAt: Date.now()
      });
      console.log('[SENTINEL] Cognitive Persistence: SAVED');
    } catch(e) {
      console.error('[SENTINEL] Persistence FAILED', e);
    }
  }

  public async hydrate(avatarId: string = 'default-avatar') {
    try {
      const snap = await getDoc(doc(db, 'avatar_memory', avatarId));
      if (snap.exists()) {
        this.state = snap.data() as AdaptiveAICompanionBehaviorInput;
        console.log('[SENTINEL] Cognitive Hydration: LOADED');
      }
    } catch(e) {
      console.error('[SENTINEL] Hydration FAILED', e);
    }
  }
}

export const companionMemory = new PseudoMemory();
