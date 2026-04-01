
'use client';

import { useState, useEffect, useCallback } from 'react';
import { PhaseState, OperatorStats } from '@/lib/game/types';
import { globalPhaseEngine } from '@/lib/game/PhaseEngine';
import { companionMemory } from '@/lib/game/PseudoMemory';
import { adaptiveAICompanionBehavior, AdaptiveAICompanionBehaviorOutput } from '@/ai/flows/adaptive-ai-companion-behavior';
import { toast } from '@/hooks/use-toast';

export const useGameEngine = () => {
  const [phase, setPhase] = useState<PhaseState>(PhaseState.LOADING);
  const [stats, setStats] = useState<OperatorStats>({
    bondLevel: 0,
    mountingStatus: 'unmounted'
  });
  const [qteActive, setQteActive] = useState(false);
  const [behaviors, setBehaviors] = useState<AdaptiveAICompanionBehaviorOutput>([]);

  // Initial loading simulation
  useEffect(() => {
    const timer = setTimeout(() => {
      globalPhaseEngine.setState(PhaseState.LANDING);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  // Sync state with global engine
  useEffect(() => {
    return globalPhaseEngine.onStateChange((newState) => {
      setPhase(newState);
    });
  }, []);

  // Agentic tick - every few seconds update behaviors based on pseudo-memory
  useEffect(() => {
    if (phase !== PhaseState.STREAMING) return;

    const agentTick = async () => {
      const snapshot = companionMemory.getSnapshot();
      try {
        const nextBehaviors = await adaptiveAICompanionBehavior(snapshot);
        setBehaviors(nextBehaviors);
      } catch (e) {
        console.error("AI Behavior tick failed", e);
      }
    };

    const interval = setInterval(agentTick, 5000);
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
        description: "Mount connection establishing...",
        variant: "default"
      });
      
      // Advance to streaming
      setTimeout(() => {
        globalPhaseEngine.setState(PhaseState.STREAMING);
        setStats(prev => ({ ...prev, mountingStatus: 'mounted' }));
      }, 1500);
    } else {
      setStats(prev => ({ ...prev, bondLevel: Math.max(0, prev.bondLevel - 5) }));
      toast({
        title: "Feedback Detected",
        description: "Mount rejected operator sync.",
        variant: "destructive"
      });
    }
  }, []);

  return {
    phase,
    stats,
    qteActive,
    behaviors,
    startLaunch,
    handleQTEResult
  };
};
