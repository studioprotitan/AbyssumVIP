
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  PhaseState, 
  OperatorStats, 
  SurvivalDirective, 
  ThreatLevel, 
  Locomotion, 
  Environment,
  ArtifactSnapshot,
  MissionContext
} from '@/lib/game/types';
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
  const [isRecording, setIsRecording] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [artifactLog, setArtifactLog] = useState<ArtifactSnapshot[]>([]);
  const [currentWave, setCurrentWave] = useState(1);
  
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
      
      let wave = 1;
      if (tickCount.current > 12) wave = 3;
      else if (tickCount.current > 6) wave = 2;
      setCurrentWave(wave);

      const snapshot = companionMemory.getSnapshot();
      
      let currentHazard: string | undefined = undefined;
      let forceDirective: SurvivalDirective | null = null;
      let forceLocomotion: Locomotion | null = null;

      if (wave === 1) {
        companionMemory.update({ threatLevel: ThreatLevel.LOW, missionContext: MissionContext.launchPrep });
      } else if (wave === 2) {
        if (tickCount.current % 3 === 0) {
          forceLocomotion = Locomotion.vault;
          companionMemory.update({ environment: Environment.railcar });
        }
      } else if (wave === 3) {
        if (tickCount.current % 2 === 0) {
          currentHazard = tickCount.current % 4 === 0 ? "CRITICAL FALL DETECTED" : "IMMINENT DROWNING";
          forceDirective = SurvivalDirective.EMERGENCY;
          forceLocomotion = tickCount.current % 4 === 0 ? Locomotion.falling : Locomotion.swim;
          companionMemory.update({ 
            environment: tickCount.current % 4 === 0 ? Environment.rooftop : Environment.water,
            threatLevel: ThreatLevel.CRITICAL 
          });
        }
      }

      const newEntropy = Math.min(1, Math.max(0, stats.entropyScore + (Math.random() * 0.15 - 0.05)));
      const newDrift = Math.min(1, Math.max(0, stats.driftScore + (Math.random() * 0.08 - 0.03)));

      try {
        const intel = await getOracleIntel({
          environment: snapshot.environment,
          threatLevel: snapshot.threatLevel,
          entropyScore: newEntropy,
          pilotIntent: snapshot.pilotIntent
        });
        setOracleIntel(intel);

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

        let activeAction = "idle";
        if (forceLocomotion) {
          globalStateMachine.transition(forceLocomotion);
          companionMemory.update({ locomotion: forceLocomotion });
          activeAction = forceLocomotion;
        } else if (nextBehaviors.length > 0) {
          const topAction = nextBehaviors[0];
          activeAction = topAction.name;
          const locomotionType = Locomotion[topAction.name as keyof typeof Locomotion] || Locomotion.idle;
          if (globalStateMachine.transition(locomotionType)) {
            companionMemory.update({ locomotion: locomotionType });
          }
        }

        const finalDirective = forceDirective || intel.suggestedDirective;
        const finalThreat = currentHazard ? ThreatLevel.CRITICAL : (wave === 3 ? ThreatLevel.HIGH : (wave === 2 ? ThreatLevel.MODERATE : ThreatLevel.LOW));

        setStats(prev => ({ 
          ...prev, 
          activeDirective: finalDirective,
          threatLevel: finalThreat,
          entropyScore: newEntropy,
          driftScore: newDrift,
          hazardDetected: currentHazard
        }));

        if (isRecording) {
          setArtifactLog(prev => [
            {
              timestamp: Date.now(),
              directive: finalDirective,
              threat: finalThreat,
              entropy: newEntropy,
              drift: newDrift,
              action: activeAction,
              riskAssessment: intel.riskAssessment
            },
            ...prev
          ].slice(0, 50));
        }

        if (currentHazard) {
          toast({
            title: "SURVIVAL PRIME ACTIVE",
            description: currentHazard,
            variant: "destructive"
          });
        }

      } catch (e) {
        // Error handling through central listener
      }
    };

    const interval = setInterval(agentTick, 4000);
    agentTick();
    return () => clearInterval(interval);
  }, [phase, stats.entropyScore, stats.driftScore, isRecording]);

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
      title: "Mint-to-Deploy Skill",
      description: "Injecting Tactical Shield into Combat Memory...",
    });
    setStats(prev => ({ ...prev, driftScore: 0.01, activeDirective: SurvivalDirective.FIGHT }));
    if (isRecording) {
      setArtifactLog(prev => [
        {
          timestamp: Date.now(),
          directive: SurvivalDirective.FIGHT,
          threat: stats.threatLevel,
          entropy: stats.entropyScore,
          drift: 0.01,
          action: "Skill: Tactical Shield Deploy",
          riskAssessment: "Defensive perimeter established via Mint-to-Deploy."
        },
        ...prev
      ].slice(0, 50));
    }
  }, [isRecording, stats.threatLevel, stats.entropyScore]);

  const toggleRecording = useCallback(() => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      setArtifactLog([]);
      toast({
        title: "Recording Started",
        description: "Capturing investor artifact loop...",
      });
    } else {
      toast({
        title: "Recording Stopped",
        description: `Artifact finalized with ${artifactLog.length} snapshots.`,
      });
    }
  }, [isRecording, artifactLog.length]);

  const toggleReport = useCallback(() => {
    setShowReport(prev => !prev);
  }, []);

  return {
    phase,
    stats,
    qteActive,
    behaviors,
    oracleIntel,
    isRecording,
    showReport,
    artifactLog,
    currentWave,
    startLaunch,
    handleQTEResult,
    injectSkill,
    toggleRecording,
    toggleReport
  };
};
