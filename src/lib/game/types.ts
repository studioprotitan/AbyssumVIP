
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
  brace = 'brace',
  climb = 'climb',
  swim = 'swim',
  falling = 'falling'
}

export enum Environment {
  interior = 'interior',
  exterior = 'exterior',
  railcar = 'railcar',
  rooftop = 'rooftop',
  tunnel = 'tunnel',
  water = 'water'
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

export enum SurvivalDirective {
  FIGHT = 'FIGHT',
  FLIGHT = 'FLIGHT',
  SURVIVAL = 'SURVIVAL',
  EMERGENCY = 'EMERGENCY'
}

export enum ThreatLevel {
  LOW = 'LOW',
  MODERATE = 'MODERATE',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface AdaptiveAICompanionBehaviorInput {
  locomotion: Locomotion;
  environment: Environment;
  missionContext: MissionContext;
  pilotIntent: PilotIntent;
  personality: Personality;
  threatLevel: ThreatLevel;
  entropyScore: number;
  timestamp: number;
}

export interface OracleIntelOutput {
  suggestedDirective: SurvivalDirective;
  tacticalWeights: Record<string, number>;
  riskAssessment: string;
}

export interface BehaviorAction {
  name: string;
  conditions: string[];
  animationRange: [number, number];
  priority: number;
  signalPulseWeight: number;
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
  activeDirective: SurvivalDirective;
  threatLevel: ThreatLevel;
  entropyScore: number;
  driftScore: number;
  hazardDetected?: string;
}
