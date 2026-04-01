
import { Locomotion, PhaseState } from './types';

export class StateMachine {
  private currentState: Locomotion = Locomotion.idle;

  public transition(next: Locomotion): boolean {
    // Deterministic validation: No action executes outside SSOT
    // For example, can't vault if already swimming (simple rule)
    if (this.currentState === Locomotion.swim && next === Locomotion.vault) {
      return false;
    }

    this.currentState = next;
    return true;
  }

  public getCurrentState(): Locomotion {
    return this.currentState;
  }
}

export const globalStateMachine = new StateMachine();
