
'use client';

import React, { useMemo } from 'react';
import { PhaseState, OperatorStats } from '@/lib/game/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, Zap, Waves, Radio, Crosshair, ClipboardList, Target, AlertTriangle, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HUDProps {
  phase: PhaseState;
  stats: OperatorStats;
  activeAction?: string;
  onInjectSkill?: () => void;
  isRecording?: boolean;
  onToggleRecording?: () => void;
  onToggleReport?: () => void;
}

const actionHeartbeatMap: Record<string, number> = {
  'idle': 2.0,
  'walk': 1.2,
  'sprint': 0.45,
  'jump_start': 0.4,
  'jump_loop': 0.8,
  'jump_land': 0.5,
  'DEFAULT': 1.0
};

export const HUD: React.FC<HUDProps> = ({ 
  phase, 
  stats, 
  activeAction,
  onInjectSkill, 
  isRecording, 
  onToggleRecording,
  onToggleReport
}) => {
  const heartbeatSpeed = useMemo(() => {
    const action = activeAction || 'DEFAULT';
    return actionHeartbeatMap[action] || actionHeartbeatMap['DEFAULT'];
  }, [activeAction]);

  if (phase === PhaseState.LOADING) return null;

  const isCriticalRisk = (stats.riftDetectionRisk || 0) > 0.7;

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-8 font-body">
      {/* Top Bar — Nerve Line & Tactical State */}
      <div className="flex justify-between items-start animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="space-y-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-3 h-3 rounded-full animate-pulse shadow-[0_0_8px_currentColor]",
                isCriticalRisk ? "bg-destructive text-destructive" : "bg-ember text-ember"
              )} />
              <h2 className={cn(
                "font-headline text-xl tracking-widest uppercase glitch-text",
                isCriticalRisk ? "text-destructive" : "text-ember"
              )}>
                SYNC_NODE ACTIVE
              </h2>
            </div>
            <div className="flex gap-4">
              <Badge variant="outline" className="border-ember/50 text-ember/80 font-code text-[10px] bg-void/40 uppercase">
                Directive: {stats.activeDirective}
              </Badge>
              <Badge variant="outline" className="border-destructive/50 text-destructive/80 font-code text-[10px] bg-void/40 uppercase">
                Threat: {stats.threatLevel}
              </Badge>
            </div>
          </div>

          {stats.hazardDetected && (
            <div className="p-2 bg-destructive/20 border-l-4 border-destructive animate-pulse">
              <div className="flex items-center gap-2">
                <AlertTriangle className="size-4 text-destructive" />
                <span className="font-code text-xs text-destructive font-bold uppercase">{stats.hazardDetected}</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-6 pointer-events-auto">
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-ember/70">
            <div className="flex flex-col items-end">
              <span className="font-code text-[10px] opacity-40 uppercase tracking-widest text-ember">Signal Integrity</span>
              <span className="font-code text-xs animate-telemetry-pulse">{(stats.signalIntegrity || 0).toFixed(1)}%</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="font-code text-[10px] opacity-40 uppercase tracking-widest text-ember">Nerve Stability</span>
              <span className="font-code text-xs animate-telemetry-pulse">{(100 - stats.driftScore * 100).toFixed(1)}%</span>
            </div>
          </div>

          {phase === PhaseState.STREAMING && (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onToggleReport}
                className="border-ember/30 text-ember hover:bg-ember/20 bg-void/40 font-code text-[10px] tracking-widest h-8"
              >
                <ClipboardList className="size-3 mr-2" />
                DIAGNOSTICS
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onToggleRecording}
                className={cn(
                  "border-ember/30 font-code text-[10px] tracking-widest h-8 px-4",
                  isRecording ? "bg-destructive/20 text-destructive border-destructive/50 animate-pulse" : "bg-void/40 text-ember hover:bg-ember/20"
                )}
              >
                <Radio className={cn("size-3 mr-2", isRecording && "animate-spin")} />
                {isRecording ? "FINALIZE_LOG" : "RECORD_LOG"}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Center Reticle */}
      {phase === PhaseState.STREAMING && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center">
          {activeAction && (
            <div 
              key={activeAction}
              className="absolute font-headline text-3xl text-primary uppercase tracking-[0.2em] pointer-events-none animate-heartbeat drop-shadow-[0_0_15px_rgba(255,140,51,0.4)]"
              style={{ '--heartbeat-speed': `${heartbeatSpeed}s` } as React.CSSProperties}
            >
              {activeAction}
            </div>
          )}
          <div className="relative size-24 flex items-center justify-center">
            <div className={cn(
              "absolute inset-0 border rounded-full animate-ping",
              isCriticalRisk ? "border-destructive/20" : "border-ember/10"
            )} />
            <div className={cn(
              "absolute inset-4 border rounded-full animate-pulse",
              isCriticalRisk ? "border-destructive/40" : "border-ember/20"
            )} />
            <Crosshair className={cn("size-8", isCriticalRisk ? "text-destructive/40" : "text-ember/20")} />
            <Target className={cn("size-6 absolute", isCriticalRisk ? "text-destructive" : "text-ember/50")} />
          </div>
          
          <div className="absolute -bottom-12 flex flex-col items-center">
             <span className="font-code text-[9px] text-ember/30 uppercase tracking-[0.3em]">Pulse Distance</span>
             <span className="font-code text-xs text-ember/80">{(stats.distanceFromPulse || 0).toFixed(1)}m</span>
          </div>
        </div>
      )}

      {/* Bottom Bar — Grid Resonance */}
      <div className="flex justify-between items-end gap-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex-1 max-w-sm space-y-3 pointer-events-auto">
          <div className="flex justify-between items-end">
            <div className="flex flex-col">
              <span className="font-code text-[10px] text-ember/40 uppercase">Grid Resonance</span>
              <span className="font-headline text-sm tracking-tighter text-ember uppercase">Signal Integrity</span>
            </div>
            <span className="font-code text-lg font-bold text-ember animate-telemetry-pulse">{stats.bondLevel}%</span>
          </div>
          <div className="relative h-2 bg-void/60 border border-ember/20 overflow-hidden">
            <div 
              className="h-full bg-ember shadow-[0_0_12px_#FF8C33] transition-all duration-500"
              style={{ width: `${stats.bondLevel}%` }}
            />
          </div>
        </div>

        <div className="flex gap-12 pb-1 opacity-40">
           <Waves className="size-5 text-primary animate-pulse" />
           <ShieldCheck className="size-5 text-secondary animate-pulse" />
           <Zap className="size-5 text-ember animate-pulse" />
        </div>
      </div>
    </div>
  );
};
