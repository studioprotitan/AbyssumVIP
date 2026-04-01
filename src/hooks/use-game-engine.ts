
'use client';

import { useState, useEffect, useCallback } from 'react';
import { PhaseState, OperatorStats, SurvivalDirective, ThreatLevel, Locomotion } from '@/lib/game/types';
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
    threatLevel: ThreatLevel.LOW
  });
  const [qteActive, setQteActive] = useState(false);
  const [behaviors, setBehaviors] = useState<AdaptiveAICompanionBehaviorOutput>([]);
  const [oracleIntel, setOracleIntel] = useState<OracleIntelOutput | null>(null);

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

  // Agentic tick
  useEffect(() => {
    if (phase !== PhaseState.STREAMING) return;

    const agentTick = async () => {
      const snapshot = companionMemory.getSnapshot();
      
      try {
        // 1. Oracle AI analyzes world
        const intel = await getOracleIntel({
          environment: snapshot.environment,
          threatLevel: snapshot.threatLevel,
          entropyScore: snapshot.entropyScore,
          pilotIntent: snapshot.pilotIntent
        });
        setOracleIntel(intel);
        setStats(prev => ({ 
          ...prev, 
          activeDirective: intel.suggestedDirective 
        }));

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
          entropyScore: snapshot.entropyScore
        });
        setBehaviors(nextBehaviors);

        // 3. State Machine commits first ranked action
        if (nextBehaviors.length > 0) {
          const topAction = nextBehaviors[0];
          const locomotionType = Locomotion[topAction.name as keyof typeof Locomotion] || Locomotion.idle;
          if (globalStateMachine.transition(locomotionType)) {
            companionMemory.update({ locomotion: locomotionType });
          }
        }
      } catch (e) {
        console.error("Brain tick failure", e);
      }
    };

    const interval = setInterval(agentTick, 6000);
    agentTick();
    return () => clearInterval(interval);
  }, [phase]);

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

  return {
    phase,
    stats,
    qteActive,
    behaviors,
    oracleIntel,
    startLaunch,
    handleQTEResult
  };
};
