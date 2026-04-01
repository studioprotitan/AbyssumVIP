
export enum PhaseState {
  LOADING = 'LOADING',
  LANDING = 'LANDING',
  STREAMING = 'STREAMING'
}

export enum Locomotion {
  idle = 'idle',
  walk = 'walk',
  sprint = 'sprint',
  vault = 'vault',
  brace = 'brace'
}

export enum Environment {
  interior = 'interior',
  exterior = 'exterior',
  railcar = 'railcar',
  rooftop = 'rooftop',
  tunnel = 'tunnel'
}

export enum MissionContext {
  launchPrep = 'launchPrep',
  pursuit = 'pursuit',
  extraction = 'extraction',
  repair = 'repair',
  postCombat = 'postCombat'
}

export enum PilotIntent {
  forward = 'forward',
  evade = 'evade',
  interact = 'interact',
  aim = 'aim'
}

export enum Personality {
  cautious = 'cautious',
  efficient = 'efficient',
  aggressive = 'aggressive'
}

export interface AdaptiveAICompanionBehaviorInput {
  locomotion: Locomotion;
  environment: Environment;
  missionContext: MissionContext;
  pilotIntent: PilotIntent;
  personality: Personality;
  timestamp: number;
}

export interface QTEStatus {
  active: boolean;
  prompt?: string;
  expectedKey?: string;
  loreContext?: string;
}

export interface OperatorStats {
  bondLevel: number;
  mountingStatus: 'unmounted' | 'mounting' | 'mounted';
}
