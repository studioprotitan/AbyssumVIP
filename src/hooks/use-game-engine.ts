
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
import { getSyncIntel, SyncIntelOutput } from '@/ai/flows/sync-intel-node';
import { globalOracleAI } from '@/lib/game/OracleAI';
import { toast } from '@/hooks/use-toast';

const FLASH_COOLDOWN_MS = 800;

const fuzzyMembership = (value: number, low: number, high: number) => 
  Math.max(0, Math.min(1, (value - low) / (high - low)));

export const useGameEngine = () => {
  const [phase, setPhase] = useState<PhaseState>(PhaseState.LOADING);
  const [stats, setStats] = useState<OperatorStats>({
    bondLevel: 0,
    mountingStatus: 'unmounted',
    activeDirective: SurvivalDirective.SURVIVAL,
    threatLevel: ThreatLevel.LOW,
    entropyScore: 0.1,
    driftScore: 0.05,
    signalIntegrity: 1.0
  });
  const [qteActive, setQteActive] = useState(false);
  const [behaviors, setBehaviors] = useState<AdaptiveAICompanionBehaviorOutput>([]);
  const [syncIntel, setSyncIntel] = useState<SyncIntelOutput | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [artifactLog, setArtifactLog] = useState<ArtifactSnapshot[]>([]);
  const [currentWave, setCurrentWave] = useState(1);
  const [distance, setDistance] = useState(0);
  
  const tickCount = useRef(0);
  const isProcessing = useRef(false);
  const lastFlashTime = useRef(0);

  useEffect(() => {
    const init = async () => {
      await companionMemory.hydrate('default-avatar');
      setTimeout(() => {
        globalPhaseEngine.setState(PhaseState.LANDING);
      }, 2500);
    };
    init();
  }, []);

  useEffect(() => {
    return globalPhaseEngine.onStateChange((newState) => {
      setPhase(newState);
    });
  }, []);

  useEffect(() => {
    if (phase !== PhaseState.STREAMING) return;

    const agentTick = async () => {
      if (isProcessing.current) return;
      isProcessing.current = true;

      try {
        tickCount.current++;
        
        // Narrative Distance Increase
        const newDistance = distance + (Math.random() * 50 + 20);
        setDistance(newDistance);

        // Oracle Signal Analysis
        const signalData = globalOracleAI.evaluateSignalProximity(newDistance);
        
        let wave = 1;
        if (tickCount.current > 12) wave = 3;
        else if (tickCount.current > 6) wave = 2;
        setCurrentWave(wave);

        const snapshot = companionMemory.getSnapshot();
        
        let currentHazard: string | undefined = undefined;
        let forceDirective: SurvivalDirective | null = null;
        let forceLocomotion: Locomotion | null = null;
        let auditLog: string | undefined = undefined;

        const entropyDelta = (Math.random() * 0.1 - 0.04) * (1 + tickCount.current * 0.02);
        const newEntropy = Math.min(1, Math.max(0, stats.entropyScore + entropyDelta));
        const newDrift = Math.min(1, Math.max(0, stats.driftScore + (Math.random() * 0.08 - 0.03)));

        const criticalMembership = fuzzyMembership(newEntropy, 0.6, 1.0);
        const shouldTriggerHazard = (wave === 3 || signalData.risk > 0.7) && Math.random() < criticalMembership;

        if (signalData.risk > 0.9) {
          currentHazard = "SIGNAL LOST. RIFT RATS OVERRUNNING.";
          forceDirective = SurvivalDirective.EMERGENCY;
        } else if (wave === 3 && shouldTriggerHazard) {
          currentHazard = newEntropy > 0.8 
            ? "CRITICAL FALL DETECTED" 
            : "IMMINENT DROWNING";
          forceDirective = SurvivalDirective.EMERGENCY;
          forceLocomotion = newEntropy > 0.8 ? Locomotion.falling : Locomotion.swim;
        }

        const intel = await getSyncIntel({
          environment: snapshot.environment,
          threatLevel: signalData.threat,
          entropyScore: newEntropy,
          pilotIntent: snapshot.pilotIntent
        });
        setSyncIntel(intel);

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
          if (globalStateMachine.transition(forceLocomotion)) {
            companionMemory.update({ locomotion: forceLocomotion });
            activeAction = forceLocomotion;
          }
        } else if (nextBehaviors.length > 0) {
          const topAction = nextBehaviors[0];
          activeAction = topAction.name;
          const locomotionType = Locomotion[topAction.name as keyof typeof Locomotion] || Locomotion.idle;
          if (globalStateMachine.transition(locomotionType)) {
            companionMemory.update({ locomotion: locomotionType });
          }
        }

        const finalDirective = forceDirective || intel.suggestedDirective;

        setStats(prev => ({ 
          ...prev, 
          activeDirective: finalDirective,
          threatLevel: signalData.threat,
          entropyScore: newEntropy,
          driftScore: newDrift,
          signalIntegrity: signalData.integrity * 100,
          hazardDetected: currentHazard
        }));

        if (isRecording) {
          setArtifactLog(prev => [
            {
              timestamp: Date.now(),
              directive: finalDirective,
              threat: signalData.threat,
              entropy: newEntropy,
              drift: newDrift,
              action: activeAction,
              riskAssessment: intel.riskAssessment,
              signalIntegrity: signalData.integrity * 100,
              audit: auditLog
            },
            ...prev
          ].slice(0, 50));
        }

        if (currentHazard || signalData.risk > 0.5) {
          const now = Date.now();
          if (now - lastFlashTime.current > FLASH_COOLDOWN_MS) {
            lastFlashTime.current = now;
            toast({
              title: signalData.risk > 0.8 ? "RIFT DETECTION ALERT" : "SIGNAL WARNING",
              description: currentHazard || globalOracleAI.getTurretComm(signalData.risk),
              variant: "destructive"
            });
          }
        }

      } catch (e) {
        console.error('[STATE_CORE:ERROR] SYNC_BRIDGE Failure', e);
      } finally {
        isProcessing.current = false;
      }
    };

    const interval = setInterval(agentTick, 4000);
    agentTick();
    return () => clearInterval(interval);
  }, [phase, stats.entropyScore, stats.driftScore, isRecording, distance]);

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
        description: "SYNC_NODE online...",
      });
      
      setTimeout(() => {
        globalPhaseEngine.setState(PhaseState.STREAMING);
        setStats(prev => ({ ...prev, mountingStatus: 'mounted' }));
      }, 1500);
    } else {
      setStats(prev => ({ ...prev, bondLevel: Math.max(0, prev.bondLevel - 5) }));
      toast({
        title: "Feedback Detected",
        description: "SYNC_NODE rejected.",
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
          riskAssessment: "Defensive perimeter established via Mint-to-Deploy.",
          signalIntegrity: stats.signalIntegrity
        },
        ...prev
      ].slice(0, 50));
    }
  }, [isRecording, stats.threatLevel, stats.entropyScore, stats.signalIntegrity]);

  const toggleRecording = useCallback(async () => {
    const nextRecordingState = !isRecording;
    setIsRecording(nextRecordingState);
    if (!nextRecordingState) {
      await companionMemory.save('default-avatar');
      toast({
        title: "Recording Stopped",
        description: `Artifact finalized with ${artifactLog.length} snapshots. Cognitive memory persisted.`,
      });
    } else {
      setArtifactLog([]);
      toast({
        title: "Recording Started",
        description: "Capturing investor artifact loop...",
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
    syncIntel,
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
