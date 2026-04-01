
import { AdaptiveAICompanionBehaviorInput, Locomotion, Environment, MissionContext, PilotIntent, Personality } from '@/ai/flows/adaptive-ai-companion-behavior';

export class PseudoMemory {
  private state: AdaptiveAICompanionBehaviorInput;

  constructor() {
    this.state = {
      locomotion: Locomotion.idle,
      environment: Environment.interior,
      missionContext: MissionContext.launchPrep,
      pilotIntent: PilotIntent.forward,
      personality: Personality.efficient,
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
}

export const companionMemory = new PseudoMemory();
