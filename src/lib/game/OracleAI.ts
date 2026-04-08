
'use client';
/**
 * OracleAI.ts
 * Cognitive Authority for narrative enforcement and signal proximity.
 * Phase 8.5 — Signal Proximity Mechanic
 */

import { companionMemory } from './PseudoMemory';
import { SurvivalDirective, ThreatLevel } from './types';

export class OracleAI {
  private static instance: OracleAI;
  
  // Narrative constraints
  private readonly SIGNAL_THRESHOLD = 850; // Distance where signal starts degrading
  private readonly SIGNAL_CRITICAL = 1200; // Total signal loss / Rift Rat Overrun zone
  
  private constructor() {}

  public static getInstance(): OracleAI {
    if (!OracleAI.instance) {
      OracleAI.instance = new OracleAI();
    }
    return OracleAI.instance;
  }

  /**
   * Evaluates signal integrity and Rift Rat detection risk based on pulse distance.
   * "Signal degrades with distance... avoid Rift Rat detection."
   */
  public evaluateSignalProximity(distance: number) {
    let integrity = 1.0;
    let risk = 0.0;

    if (distance > this.SIGNAL_THRESHOLD) {
      // Linear degradation after threshold
      integrity = Math.max(0.1, 1 - ((distance - this.SIGNAL_THRESHOLD) / (this.SIGNAL_CRITICAL - this.SIGNAL_THRESHOLD)));
      // Risk increases as signal patterns stretch
      risk = Math.min(1.0, (distance - this.SIGNAL_THRESHOLD) / (this.SIGNAL_CRITICAL - this.SIGNAL_THRESHOLD));
    }

    const threat = risk > 0.8 ? ThreatLevel.CRITICAL : (risk > 0.4 ? ThreatLevel.MODERATE : ThreatLevel.LOW);

    companionMemory.update({
      signalIntegrity: integrity,
      riftDetectionRisk: risk,
      distanceFromPulse: distance,
      threatLevel: threat
    });

    return { integrity, risk, threat };
  }

  /**
   * Generates narrative transmission lines for the CTS Turret Comm.
   */
  public getTurretComm(risk: number): string {
    if (risk > 0.8) return "SIGNAL PATTERN STRETCHED. RAT SCOUTS DETECTED. REFORGING IMMINENT.";
    if (risk > 0.5) return "PULSE WEAKENING. YOU'D RATHER BE DEAD THAN REFORGED AS A SCOUT.";
    if (risk > 0.2) return "REMAIN WITHIN PROXIMITY. AVOID SIGNAL BLEED.";
    return "SIGNAL STABLE. GRID RESISTANCE NOMINAL.";
  }
}

export const globalOracleAI = OracleAI.getInstance();
