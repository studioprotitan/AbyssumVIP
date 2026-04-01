
import { PhaseState } from './types';

export type PhaseListener = (state: PhaseState) => void;

export class PhaseEngine {
  private state: PhaseState = PhaseState.LOADING;
  private listeners: Set<PhaseListener> = new Set();

  constructor() {}

  public onStateChange(cb: PhaseListener) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  public setState(newState: PhaseState) {
    if (this.state === newState) return;
    this.state = newState;
    this.notify();
  }

  public getState() {
    return this.state;
  }

  private notify() {
    this.listeners.forEach(cb => cb(this.state));
  }
}

export const globalPhaseEngine = new PhaseEngine();
