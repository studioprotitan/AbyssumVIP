
'use client';

import React from 'react';
import { PhaseState, OperatorStats } from '@/lib/game/types';
import { Badge } from '@/components/ui/badge';
import { Activity, Zap, Shield, Target, AlertTriangle } from 'lucide-react';

interface HUDProps {
  phase: PhaseState;
  stats: OperatorStats;
}

export const HUD: React.FC<HUDProps> = ({ phase, stats }) => {
  if (phase === PhaseState.LOADING) return null;

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-8 font-body">
      {/* Top Bar */}
      <div className="flex justify-between items-start animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-ember animate-pulse shadow-[0_0_8px_#FF8C33]" />
            <h2 className="font-headline text-xl tracking-widest text-ember uppercase glitch-text">
              Oracle Intel Node
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

        <div className="grid grid-cols-2 gap-4 text-ember/70">
          <div className="flex items-center gap-2">
            <Activity className="size-4" />
            <span className="font-code text-xs">SENTINEL: SYNCED</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="size-4" />
            <span className="font-code text-xs">ENTROPY: LOW</span>
          </div>
        </div>
      </div>

      {/* Center Reticle (only in streaming) */}
      {phase === PhaseState.STREAMING && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="relative size-16 flex items-center justify-center border border-ember/20 rounded-full animate-pulse">
            <div className="absolute size-1 bg-ember rounded-full" />
            <div className="flex items-center justify-center p-1 bg-void/20 rounded">
               <Target className="size-4 text-ember/40" />
            </div>
          </div>
        </div>
      )}

      {/* Bottom Bar */}
      <div className="flex justify-between items-end gap-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex-1 max-w-xs space-y-3">
          <div className="flex justify-between items-end">
            <span className="font-headline text-xs tracking-tighter text-ember uppercase">Bond Resonance</span>
            <span className="font-code text-lg font-bold text-ember">{stats.bondLevel}%</span>
          </div>
          <div className="relative h-2 bg-void/60 border border-ember/20 rounded-none overflow-hidden">
            <div 
              className="h-full bg-ember shadow-[0_0_12px_#FF8C33] transition-all duration-500 ease-out"
              style={{ width: `${stats.bondLevel}%` }}
            />
          </div>
        </div>

        <div className="flex gap-8 pb-1">
          <div className="flex flex-col items-center gap-1">
            <Shield className="size-5 text-ember/40" />
            <span className="font-code text-[8px]">GUARD</span>
          </div>
          <div className="flex flex-col items-center gap-1">
             <AlertTriangle className="size-5 text-destructive/40" />
             <span className="font-code text-[8px]">SURVIVAL</span>
          </div>
        </div>
      </div>
    </div>
  );
};
