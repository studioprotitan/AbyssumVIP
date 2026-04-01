
'use client';

import React from 'react';
import { PhaseState, OperatorStats } from '@/lib/game/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, Zap, Shield, Target, AlertTriangle, Cpu, BrainCircuit, Waves, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HUDProps {
  phase: PhaseState;
  stats: OperatorStats;
  onInjectSkill?: () => void;
  isRecording?: boolean;
  onToggleRecording?: () => void;
}

export const HUD: React.FC<HUDProps> = ({ 
  phase, 
  stats, 
  onInjectSkill, 
  isRecording, 
  onToggleRecording 
}) => {
  if (phase === PhaseState.LOADING) return null;

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-8 font-body">
      {/* Top Bar - Oracle & Tactical Array */}
      <div className="flex justify-between items-start animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="space-y-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-ember animate-pulse shadow-[0_0_8px_#FF8C33]" />
              <h2 className="font-headline text-xl tracking-widest text-ember uppercase glitch-text">
                Avatar Brain Core
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
              <span className="font-code text-[10px] opacity-40 uppercase">Entropy</span>
              <div className="flex items-center gap-2">
                <Zap className="size-3" />
                <span className="font-code text-xs">{(stats.entropyScore * 100).toFixed(1)}%</span>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="font-code text-[10px] opacity-40 uppercase">Sentinel Drift</span>
              <div className="flex items-center gap-2">
                <BrainCircuit className="size-3" />
                <span className="font-code text-xs">{(stats.driftScore * 100).toFixed(1)}%</span>
              </div>
            </div>
            <div className="flex flex-col items-end col-span-2 mt-2">
              <span className="font-code text-[10px] opacity-40 uppercase">Tactical AI Array</span>
              <div className="flex items-center gap-2 text-primary">
                <Cpu className="size-3" />
                <span className="font-code text-xs">ACTIVE / ANALYZING TERRAIN</span>
              </div>
            </div>
          </div>

          {phase === PhaseState.STREAMING && (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onToggleRecording}
                className={cn(
                  "border-ember/30 font-code text-[10px] tracking-widest h-8 px-4",
                  isRecording ? "bg-destructive/20 text-destructive animate-pulse" : "bg-void/40 text-ember hover:bg-ember/20"
                )}
              >
                <Radio className={cn("size-3 mr-2", isRecording && "animate-spin")} />
                {isRecording ? "STOP ARTIFACT" : "RECORD ARTIFACT"}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onInjectSkill}
                className="border-ember/30 text-ember hover:bg-ember/20 bg-void/40 font-code text-[10px] tracking-widest h-8"
              >
                MINT-TO-DEPLOY SKILL
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Center Reticle */}
      {phase === PhaseState.STREAMING && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-20">
          <div className="relative size-24 flex items-center justify-center">
            <div className="absolute inset-0 border border-ember/10 rounded-full animate-ping" />
            <div className="absolute inset-4 border border-ember/20 rounded-full animate-pulse" />
            <Target className="size-6 text-ember/30" />
            
            <div className="absolute top-full mt-4 flex flex-col items-center gap-1 opacity-40">
              <div className="h-10 w-px bg-ember/20" />
              <div className="bg-void/60 px-2 py-1 border border-ember/20">
                <span className="font-code text-[8px] whitespace-nowrap uppercase">Line Trace: Terrain Point [42.1, -12.4]</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Bar - Bond & Status */}
      <div className="flex justify-between items-end gap-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex-1 max-w-sm space-y-3">
          <div className="flex justify-between items-end">
            <div className="flex flex-col">
              <span className="font-code text-[10px] text-ember/40 uppercase">Cognitive Coherence</span>
              <span className="font-headline text-sm tracking-tighter text-ember uppercase">Bond Resonance</span>
            </div>
            <span className="font-code text-lg font-bold text-ember">{stats.bondLevel}%</span>
          </div>
          <div className="relative h-2 bg-void/60 border border-ember/20 rounded-none overflow-hidden">
            <div 
              className="h-full bg-ember shadow-[0_0_12px_#FF8C33] transition-all duration-500 ease-out"
              style={{ width: `${stats.bondLevel}%` }}
            />
          </div>
        </div>

        <div className="flex gap-12 pb-1">
          <div className="flex flex-col items-center gap-1 opacity-60">
            <Shield className="size-5 text-ember" />
            <span className="font-code text-[8px] uppercase">SSOT Auth</span>
          </div>
          <div className="flex flex-col items-center gap-1 opacity-60">
             <Waves className="size-5 text-primary" />
             <span className="font-code text-[8px] uppercase">Terrain AI</span>
          </div>
          <div className="flex flex-col items-center gap-1 opacity-60">
             <Activity className="size-5 text-secondary" />
             <span className="font-code text-[8px] uppercase">MOAI Live</span>
          </div>
        </div>
      </div>
    </div>
  );
};
