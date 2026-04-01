
'use client';

import React from 'react';
import { OperatorStats, PhaseState } from '@/lib/game/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Cpu, 
  BrainCircuit, 
  Activity, 
  ShieldCheck, 
  Zap, 
  Lock, 
  Database,
  Terminal
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SystemsReportProps {
  active: boolean;
  stats: OperatorStats;
  onClose: () => void;
}

export const SystemsReport: React.FC<SystemsReportProps> = ({ active, stats, onClose }) => {
  if (!active) return null;

  return (
    <div className="absolute inset-0 z-[60] bg-void-dark/95 backdrop-blur-xl flex items-center justify-center p-8 animate-in fade-in zoom-in-95 duration-300">
      <div className="max-w-5xl w-full h-full flex flex-col gap-6">
        {/* Header */}
        <div className="flex justify-between items-end border-b border-ember/20 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Terminal className="size-5 text-ember" />
              <h1 className="font-headline text-3xl text-ember uppercase tracking-tighter glitch-text">
                Systems Diagnostic Report
              </h1>
            </div>
            <p className="font-code text-xs text-ember/40 uppercase">
              Sentinel ID: AB-V5.3-001 // Abyssum Persistence Oversight
            </p>
          </div>
          <button 
            onClick={onClose}
            className="font-code text-xs text-ember hover:text-white transition-colors border border-ember/20 px-4 py-2 bg-void/40"
          >
            [ DISMISS_DIAGNOSTICS ]
          </button>
        </div>

        {/* Diagnostic Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {/* Core Processing Node Status */}
          <Card className="bg-void/40 border-ember/10 rounded-none">
            <CardHeader className="pb-2 border-b border-ember/5">
              <CardTitle className="font-code text-xs text-ember/60 uppercase flex items-center gap-2">
                <Cpu className="size-4" /> Cognitive Core Status
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between font-code text-[10px] text-ember/40">
                  <span>ORACLE_INTEL_NODE</span>
                  <span className="text-primary">ACTIVE</span>
                </div>
                <Progress value={92} className="h-1 bg-void" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between font-code text-[10px] text-ember/40">
                  <span>GOAP_PLANNER_ARRAY</span>
                  <span className="text-primary">SYNCED</span>
                </div>
                <Progress value={88} className="h-1 bg-void" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between font-code text-[10px] text-ember/40">
                  <span>SENTINEL_DRIFT_REASONING</span>
                  <span className="text-ember">CALIBRATING</span>
                </div>
                <Progress value={45} className="h-1 bg-void" />
              </div>
            </CardContent>
          </Card>

          {/* Memory Slot Integrity */}
          <Card className="bg-void/40 border-ember/10 rounded-none">
            <CardHeader className="pb-2 border-b border-ember/5">
              <CardTitle className="font-code text-xs text-ember/60 uppercase flex items-center gap-2">
                <Database className="size-4" /> Memory Slot Integrity
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-2">
              {[
                { label: 'Locomotion_A', status: 'LOCKED' },
                { label: 'Combat_Prime', status: 'LOCKED' },
                { label: 'Tactics_V4', status: 'LOCKED' },
                { label: 'Audio_ADG_Link', status: 'DEGRADED', warning: true },
                { label: 'Survival_Directives', status: 'LOCKED' },
              ].map((slot) => (
                <div key={slot.label} className="flex justify-between items-center p-2 bg-void/20 border border-ember/5">
                  <span className="font-code text-[10px] text-ember/80">{slot.label}</span>
                  <Badge variant="outline" className={cn(
                    "text-[8px] h-4 rounded-none border-0",
                    slot.warning ? "bg-destructive/20 text-destructive" : "bg-primary/20 text-primary"
                  )}>
                    {slot.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Tactical Telemetry */}
          <Card className="bg-void/40 border-ember/10 rounded-none">
            <CardHeader className="pb-2 border-b border-ember/5">
              <CardTitle className="font-code text-xs text-ember/60 uppercase flex items-center gap-2">
                <Activity className="size-4" /> Real-time Telemetry
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-6">
              <div className="flex flex-col items-center">
                 <span className="font-code text-[10px] text-ember/40 uppercase mb-2">Entropy Flux</span>
                 <div className="relative size-32 flex items-center justify-center">
                    <div className="absolute inset-0 border-2 border-dashed border-ember/10 rounded-full animate-spin duration-10000" />
                    <span className="font-headline text-3xl text-ember">{(stats.entropyScore * 100).toFixed(0)}</span>
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                   <span className="font-code text-[8px] text-ember/40 uppercase">Drift Score</span>
                   <p className="font-code text-sm text-ember">{(stats.driftScore * 100).toFixed(2)}%</p>
                 </div>
                 <div className="space-y-1">
                   <span className="font-code text-[8px] text-ember/40 uppercase">Bond Level</span>
                   <p className="font-code text-sm text-primary">{stats.bondLevel}%</p>
                 </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer Technical Logs */}
        <div className="h-48 bg-void/60 border border-ember/10 p-4 font-code text-[10px] text-ember/60 space-y-1 overflow-hidden">
          <p className="text-primary">[OK] SSOT Initialization Complete</p>
          <p>[INFO] Oracle Intelligence Node reporting environment: EXTERIOR_RAILCAR</p>
          <p>[INFO] GOAP recalculation triggered by Directive: {stats.activeDirective}</p>
          <p className={cn(stats.driftScore > 0.5 ? "text-destructive" : "")}>
            [WARN] Sentinel Drift detected at {(stats.driftScore * 100).toFixed(1)}% threshold
          </p>
          <p>[INFO] Tactical AI Array analyzing threat wave: {stats.threatLevel}</p>
          <p className="animate-pulse">_ Awaiting signal pulse from Pilot Interface...</p>
        </div>
      </div>
    </div>
  );
};
