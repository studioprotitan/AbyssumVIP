
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  PhaseState, 
  OperatorStats, 
  SurvivalDirective, 
  ThreatLevel, 
  Locomotion, 
  Environment,
  ArtifactSnapshot
} from '@/lib/game/types';
import { globalPhaseEngine } from '@/lib/game/PhaseEngine';
import { globalStateMachine } from '@/lib/game/StateMachine';
import { companionMemory } from '@/lib/game/PseudoMemory';
import { adaptiveAICompanionBehavior, AdaptiveAICompanionBehaviorOutput } from '@/ai/flows/adaptive-ai-companion-behavior';
import { getSyncIntel, SyncIntelOutput } from '@/ai/flows/sync-intel-node';
import { globalOracleAI } from '@/lib/game/OracleAI';
import { toast } from '@/hooks/use-toast';

export const useGameEngine = () => {
  const [phase, setPhase] = useState<PhaseState>(PhaseState.LOADING);
  const [stats, setStats] = useState<OperatorStats>({
    bondLevel: 0,
    mountingStatus: 'unmounted',
    activeDirective: SurvivalDirective.SURVIVAL,
    threatLevel: ThreatLevel.LOW,
    entropyScore: 0.1,
    driftScore: 0.05,
    signalIntegrity: 100,
    distanceFromPulse: 0,
    riftDetectionRisk: 0
  });
  const [qteActive, setQteActive] = useState(false);
  const [behaviors, setBehaviors] = useState<AdaptiveAICompanionBehaviorOutput>([]);
  const [syncIntel, setSyncIntel] = useState<SyncIntelOutput | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [artifactLog, setArtifactLog] = useState<ArtifactSnapshot[]>([]);
  
  const tickCount = useRef(0);
  const isProcessing = useRef(false);

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
        const distanceDelta = Math.random() * 40 + 10;
        const newDistance = stats.distanceFromPulse! + distanceDelta;

        // Oracle Signal Analysis
        const signalData = globalOracleAI.evaluateSignalProximity(newDistance);
        
        const snapshot = companionMemory.getSnapshot();
        const intel = await getSyncIntel({
          environment: snapshot.environment,
          threatLevel: signalData.threat,
          entropyScore: stats.entropyScore,
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
          entropyScore: stats.entropyScore
        });
        setBehaviors(nextBehaviors);

        if (nextBehaviors.length > 0) {
          const topAction = nextBehaviors[0];
          const locomotionType = Locomotion[topAction.name as keyof typeof Locomotion] || Locomotion.idle;
          if (globalStateMachine.transition(locomotionType)) {
            companionMemory.update({ locomotion: locomotionType });
          }
        }

        setStats(prev => ({ 
          ...prev, 
          activeDirective: intel.suggestedDirective,
          threatLevel: signalData.threat,
          signalIntegrity: signalData.integrity * 100,
          distanceFromPulse: newDistance,
          riftDetectionRisk: signalData.risk,
          entropyScore: Math.min(1, prev.entropyScore + 0.01),
          driftScore: Math.min(1, prev.driftScore + 0.005)
        }));

        if (isRecording) {
          setArtifactLog(prev => [
            {
              timestamp: Date.now(),
              directive: intel.suggestedDirective,
              threat: signalData.threat,
              entropy: stats.entropyScore,
              drift: stats.driftScore,
              action: nextBehaviors[0]?.name || 'idle',
              riskAssessment: intel.riskAssessment,
              signalIntegrity: signalData.integrity * 100,
              distance: newDistance
            },
            ...prev
          ].slice(0, 50));
        }

        if (signalData.risk > 0.5) {
          toast({
            title: "SIGNAL WARNING",
            description: globalOracleAI.getTurretComm(signalData.risk),
            variant: "destructive"
          });
        }

      } catch (e) {
        console.error('[NERVE_LINE:ERROR] SYNC_BRIDGE Failure', e);
      } finally {
        isProcessing.current = false;
      }
    };

    const interval = setInterval(agentTick, 4000);
    agentTick();
    return () => clearInterval(interval);
  }, [phase, stats.distanceFromPulse, stats.entropyScore, stats.driftScore, isRecording]);

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
      title: "Tactical Injection",
      description: "Optimizing Nerve Line response...",
    });
    setStats(prev => ({ ...prev, driftScore: Math.max(0, prev.driftScore - 0.2) }));
  }, []);

  const toggleRecording = useCallback(async () => {
    const nextRecordingState = !isRecording;
    setIsRecording(nextRecordingState);
    if (!nextRecordingState) {
      await companionMemory.save('default-avatar');
      toast({
        title: "Artifact Finalized",
        description: `Logged ${artifactLog.length} snapshots to Cognitive Core.`,
      });
    } else {
      setArtifactLog([]);
      toast({
        title: "Log Active",
        description: "Monitoring Rail Pulse flow...",
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
    startLaunch,
    handleQTEResult,
    injectSkill,
    toggleRecording,
    toggleReport
  };
};
