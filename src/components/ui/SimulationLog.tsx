
'use client';

import React from 'react';
import { ArtifactSnapshot } from '@/lib/game/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity, Shield, AlertCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SimulationLogProps {
  logs: ArtifactSnapshot[];
  active: boolean;
}

export const SimulationLog: React.FC<SimulationLogProps> = ({ logs, active }) => {
  if (!active) return null;

  return (
    <div className="absolute right-8 top-32 bottom-32 w-80 z-30 flex flex-col gap-4 animate-in slide-in-from-right-4 duration-500">
      <div className="flex items-center gap-2 px-4 py-2 bg-void/80 border-l-2 border-primary backdrop-blur-md">
        <Activity className="size-4 text-primary animate-pulse" />
        <span className="font-code text-[10px] text-primary uppercase tracking-widest">Investor Artifact Loop</span>
      </div>

      <ScrollArea className="flex-1 bg-void/40 backdrop-blur-sm border border-ember/10 p-4">
        <div className="space-y-4">
          {logs.length === 0 && (
            <div className="flex flex-col items-center justify-center h-40 opacity-20 text-center">
              <Clock className="size-8 mb-2" />
              <p className="font-code text-[10px] uppercase">Awaiting Data Stream...</p>
            </div>
          )}
          {logs.map((log, i) => (
            <div 
              key={log.timestamp} 
              className={cn(
                "p-3 border-l-2 space-y-2 transition-all duration-300",
                i === 0 ? "bg-ember/5 border-ember scale-100" : "opacity-50 border-ember/20 scale-95"
              )}
            >
              <div className="flex justify-between items-start">
                <span className="font-code text-[8px] text-ember/40">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
                <div className="flex gap-1">
                  {log.threat === 'CRITICAL' && <AlertCircle className="size-3 text-destructive animate-pulse" />}
                  <Shield className="size-3 text-primary opacity-40" />
                </div>
              </div>
              
              <div className="space-y-1">
                <p className="font-headline text-[10px] text-ember uppercase truncate">
                  {log.directive} :: {log.action}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col">
                    <span className="font-code text-[7px] text-ember/30 uppercase">Entropy</span>
                    <span className="font-code text-[9px] text-ember/80">{(log.entropy * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-code text-[7px] text-ember/30 uppercase">Drift</span>
                    <span className="font-code text-[9px] text-ember/80">{(log.drift * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
              
              {i === 0 && (
                <p className="font-body text-[8px] text-ember/60 italic leading-tight">
                  "{log.riskAssessment}"
                </p>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
