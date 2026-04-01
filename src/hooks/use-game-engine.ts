
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { PhaseState, OperatorStats, SurvivalDirective, ThreatLevel, Locomotion, Environment } from '@/lib/game/types';
import { globalPhaseEngine } from '@/lib/game/PhaseEngine';
import { globalStateMachine } from '@/lib/game/StateMachine';
import { companionMemory } from '@/lib/game/PseudoMemory';
import { adaptiveAICompanionBehavior, AdaptiveAICompanionBehaviorOutput } from '@/ai/flows/adaptive-ai-companion-behavior';
import { getOracleIntel, OracleIntelOutput } from '@/ai/flows/oracle-intel-node';
import { toast } from '@/hooks/use-toast';

export const useGameEngine = () => {
  const [phase, setPhase] = useState<PhaseState>(PhaseState.LOADING);
  const [stats, setStats] = useState<OperatorStats>({
    bondLevel: 0,
    mountingStatus: 'unmounted',
    activeDirective: SurvivalDirective.SURVIVAL,
    threatLevel: ThreatLevel.LOW,
    entropyScore: 0.1,
    driftScore: 0.05
  });
  const [qteActive, setQteActive] = useState(false);
  const [behaviors, setBehaviors] = useState<AdaptiveAICompanionBehaviorOutput>([]);
  const [oracleIntel, setOracleIntel] = useState<OracleIntelOutput | null>(null);
  
  const tickCount = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      globalPhaseEngine.setState(PhaseState.LANDING);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    return globalPhaseEngine.onStateChange((newState) => {
      setPhase(newState);
    });
  }, []);

  // Agentic Advanced Simulation Tick
  useEffect(() => {
    if (phase !== PhaseState.STREAMING) return;

    const agentTick = async () => {
      tickCount.current++;
      const snapshot = companionMemory.getSnapshot();
      
      // Simulate emergent environmental hazards
      let currentHazard: string | undefined = undefined;
      let forceDirective: SurvivalDirective | null = null;
      let forceLocomotion: Locomotion | null = null;

      if (tickCount.current % 7 === 0) {
        currentHazard = "IMMINENT DROWNING";
        forceDirective = SurvivalDirective.EMERGENCY;
        forceLocomotion = Locomotion.swim;
        companionMemory.update({ environment: Environment.water });
      } else if (tickCount.current % 11 === 0) {
        currentHazard = "CRITICAL FALL DETECTED";
        forceDirective = SurvivalDirective.EMERGENCY;
        forceLocomotion = Locomotion.falling;
        companionMemory.update({ environment: Environment.rooftop });
      } else {
        companionMemory.update({ environment: Environment.exterior });
      }

      // Simulate Entropy and Drift changes
      const newEntropy = Math.min(1, Math.max(0, stats.entropyScore + (Math.random() * 0.2 - 0.1)));
      const newDrift = Math.min(1, Math.max(0, stats.driftScore + (Math.random() * 0.1 - 0.05)));

      try {
        // 1. Oracle AI analyzes world
        const intel = await getOracleIntel({
          environment: snapshot.environment,
          threatLevel: snapshot.threatLevel,
          entropyScore: newEntropy,
          pilotIntent: snapshot.pilotIntent
        });
        setOracleIntel(intel);

        // 2. GOAP Planner ranks actions
        const nextBehaviors = await adaptiveAICompanionBehavior({
          memory: {
            locomotion: snapshot.locomotion,
            environment: snapshot.environment,
            missionContext: snapshot.missionContext,
            pilotIntent: snapshot.pilotIntent,
            personality: snapshot.personality
          },
          oracleIntel: intel,
          entropyScore: newEntropy
        });
        setBehaviors(nextBehaviors);

        // 3. State Machine commits first ranked action or Emergency override
        if (forceLocomotion) {
          globalStateMachine.transition(forceLocomotion);
          companionMemory.update({ locomotion: forceLocomotion });
        } else if (nextBehaviors.length > 0) {
          const topAction = nextBehaviors[0];
          const locomotionType = Locomotion[topAction.name as keyof typeof Locomotion] || Locomotion.idle;
          if (globalStateMachine.transition(locomotionType)) {
            companionMemory.update({ locomotion: locomotionType });
          }
        }

        setStats(prev => ({ 
          ...prev, 
          activeDirective: forceDirective || intel.suggestedDirective,
          threatLevel: currentHazard ? ThreatLevel.CRITICAL : ThreatLevel.LOW,
          entropyScore: newEntropy,
          driftScore: newDrift,
          hazardDetected: currentHazard
        }));

        if (currentHazard) {
          toast({
            title: "SURVIVAL PRIME ACTIVE",
            description: currentHazard,
            variant: "destructive"
          });
        }

      } catch (e) {
        console.error("Brain tick failure", e);
      }
    };

    const interval = setInterval(agentTick, 5000);
    agentTick();
    return () => clearInterval(interval);
  }, [phase, stats.entropyScore, stats.driftScore]);

  const startLaunch = useCallback(() => {
    setQteActive(true);
  }, []);

  const handleQTEResult = useCallback((success: boolean) => {
    setQteActive(false);
    if (success) {
      setStats(prev => ({ 
        ...prev, 
        bondLevel: Math.min(100, prev.bondLevel + 15),
        mountingStatus: 'mounting'
      }));
      toast({
        title: "Bond Resonated",
        description: "Oracle Node syncing...",
      });
      
      setTimeout(() => {
        globalPhaseEngine.setState(PhaseState.STREAMING);
        setStats(prev => ({ ...prev, mountingStatus: 'mounted' }));
      }, 1500);
    } else {
      setStats(prev => ({ ...prev, bondLevel: Math.max(0, prev.bondLevel - 5) }));
      toast({
        title: "Feedback Detected",
        description: "Oracle sync rejected.",
        variant: "destructive"
      });
    }
  }, []);

  const injectSkill = useCallback(() => {
    toast({
      title: "Mint-to-Deploy",
      description: "Injecting Dash Strike into Memory Slot Combat...",
    });
    setStats(prev => ({ ...prev, driftScore: 0.01 })); // Reset drift on sync
  }, []);

  return {
    phase,
    stats,
    qteActive,
    behaviors,
    oracleIntel,
    startLaunch,
    handleQTEResult,
    injectSkill
  };
};
