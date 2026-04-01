'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Terminal, Cpu, Database, BrainCircuit, Radio, ShieldCheck } from 'lucide-react';

interface LandingScreenProps {
  onLaunch: () => void;
  onWarmUp?: (isWarmed: boolean) => void;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({ onLaunch, onWarmUp }) => {
  const [bootProgress, setBootProgress] = useState(0);
  const [bootLabel, setBootLabel] = useState('COLD_START_INITIATED');
  const [confirmedChecks, setConfirmedChecks] = useState<string[]>([]);
  const [logs, setLogs] = useState<{ msg: string; type: 'info' | 'ok' | 'warn' }[]>([]);
  const [isWarmed, setIsWarmed] = useState(false);
  const [showDeploy, setShowDeploy] = useState(false);
  const [visibleTelem, setVisibleTelem] = useState<number>(0);

  const log = (msg: string, type: 'info' | 'ok' | 'warn' = 'info') => {
    setLogs(prev => [...prev, { msg, type }].slice(-6));
  };

  useEffect(() => {
    const sequence = async () => {
      log('ABYSSUM GATEWAY FORGE CONFIRM — BOOT INITIATED', 'info');
      setBootLabel('INITIALIZING BABYLON ENGINE');

      // Telemetry reveal sequence (slower)
      const telemReveal = setInterval(() => {
        setVisibleTelem(prev => {
          if (prev >= 6) {
            clearInterval(telemReveal);
            return 6;
          }
          return prev + 1;
        });
      }, 800);

      // System Checks — Sequenced slow
      setTimeout(() => {
        log('Babylon.js engine initialized', 'ok');
        setConfirmedChecks(prev => [...prev, 'chk-babylon']);
      }, 1000);

      setTimeout(() => {
        log('WebGL2 context verified', 'ok');
        setConfirmedChecks(prev => [...prev, 'chk-webgl']);
      }, 2000);

      setTimeout(() => {
        log('Forge mesh loaded', 'ok');
        setConfirmedChecks(prev => [...prev, 'chk-mesh']);
        setIsWarmed(true);
        onWarmUp?.(true);
      }, 3000);

      setTimeout(() => {
        log('SSOT authority locked', 'ok');
        setConfirmedChecks(prev => [...prev, 'chk-ssot']);
      }, 4200);

      setTimeout(() => {
        log('MOAI bridge broadcasting', 'ok');
        setConfirmedChecks(prev => [...prev, 'chk-moai']);
      }, 5400);

      setTimeout(() => {
        log('Sentinel drift check passed', 'ok');
        setConfirmedChecks(prev => [...prev, 'chk-sentinel']);
      }, 6600);

      // Slow progress fill
      const progressInterval = setInterval(() => {
        setBootProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return prev + 1;
        });
      }, 80);

      return () => {
        clearInterval(telemReveal);
        clearInterval(progressInterval);
      };
    };

    sequence();
  }, [onWarmUp]);

  // Handle all systems green
  useEffect(() => {
    if (confirmedChecks.length === totalSystems) {
      setTimeout(() => {
        setBootLabel('ALL SYSTEMS GREEN — OPERATIVE READY');
        log('ALL SYSTEMS WARM — FORGE ATOM ACTIVE', 'ok');
        setShowDeploy(true);
      }, 800);
    }
  }, [confirmedChecks]);

  const systems = [
    { id: 'chk-babylon', name: 'BABYLON_ENGINE', icon: Cpu },
    { id: 'chk-webgl', name: 'WEBGL2_CONTEXT', icon: Terminal },
    { id: 'chk-mesh', name: 'FORGE_MESH', icon: Database },
    { id: 'chk-ssot', name: 'SSOT_AUTHORITY', icon: ShieldCheck },
    { id: 'chk-moai', name: 'MOAI_BRIDGE', icon: Radio },
    { id: 'chk-sentinel', name: 'SENTINEL_DRIFT', icon: BrainCircuit },
  ];

  const totalSystems = systems.length;

  const telemLines = [
    'ENGINE: Babylon.js v7.54.3',
    'RENDERER: WebGL2',
    'SHADER: PARALLEL',
    'ENTROPY_FLUX: 0.37',
    'DRIFT_SCORE: 2.41%',
    'BOND_LEVEL: 78%'
  ];

  return (
    <div className="absolute inset-0 z-40 bg-void-dark font-code flex flex-col overflow-hidden">
      {/* Overlays */}
      <div className="absolute inset-0 pointer-events-none scanline opacity-30 z-50 animate-pulse-ember" />
      <div className="absolute inset-0 pointer-events-none noise-grain z-40" />

      {/* Header */}
      <div className={cn(
        "h-14 border-b border-white/5 flex items-center justify-between px-8 bg-black/80 backdrop-blur-sm z-30 transition-colors duration-1000",
        isWarmed && "border-ember/20"
      )}>
        <div className="font-headline text-[10px] tracking-[0.4em] text-white/40 uppercase">Abyssum Gateway</div>
        <div className="text-[10px] tracking-[0.3em] text-white/20 uppercase">Forge Confirm // Phase 8.4 // Build v1.5.2</div>
        <div className="text-[10px] tracking-[0.2em] text-white/40">{new Date().toLocaleTimeString()}</div>
      </div>

      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-[280px_1fr_280px] z-20">
        {/* Left Panel */}
        <div className="border-r border-white/5 p-8 flex flex-col gap-8 bg-black/20">
          <div className="space-y-4">
            <span className="text-[8px] tracking-[0.4em] text-white/20 uppercase block border-b border-white/5 pb-2">System Integrity</span>
            <div className="space-y-2">
              {systems.map(sys => (
                <div 
                  key={sys.id}
                  className={cn(
                    "flex items-center justify-between p-2 border transition-all duration-500",
                    confirmedChecks.includes(sys.id) ? "border-ember/40 bg-ember/5" : "border-white/5 bg-white/5"
                  )}
                >
                  <span className={cn("text-[8px] tracking-widest uppercase", confirmedChecks.includes(sys.id) ? "text-ember" : "text-white/20")}>
                    {sys.name}
                  </span>
                  <span className={cn("text-[8px] tracking-widest", confirmedChecks.includes(sys.id) ? "text-green-500" : "text-white/20")}>
                    {confirmedChecks.includes(sys.id) ? "CONFIRMED" : "SCANNING"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <span className="text-[8px] tracking-[0.4em] text-white/20 uppercase block border-b border-white/5 pb-2">Telemetry</span>
            <div className="space-y-1">
              {telemLines.map((t, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "text-[8px] tracking-wider transition-all duration-500",
                    visibleTelem > i ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2",
                    isWarmed && i > 2 ? "text-ember" : "text-white/40",
                    isWarmed && "animate-console-breathe"
                  )}
                >
                  {t}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center Area */}
        <div className="relative">
          <div className={cn("absolute inset-0 border border-white/5 transition-colors duration-1000 m-4", isWarmed && "border-ember/20")} />
          
          {/* Orbital Pulsing Elements */}
          <div className={cn(
            "absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-1000",
            isWarmed ? "opacity-20" : "opacity-5"
          )}>
            <div className={cn("size-[300px] border border-dashed border-white rounded-full animate-spin duration-[20s]", isWarmed && "animate-console-breathe")} />
            <div className={cn("absolute size-[220px] border border-dashed border-white rounded-full animate-spin duration-[15s] direction-reverse", isWarmed && "animate-console-breathe")} />
            <div className={cn("absolute size-[140px] border border-white/20 rounded-full animate-pulse", isWarmed && "animate-console-breathe")} />
          </div>

          <div className={cn("absolute top-8 left-8 size-8 border-t border-l transition-colors", isWarmed ? "border-ember" : "border-white/10")} />
          <div className={cn("absolute top-8 right-8 size-8 border-t border-r transition-colors", isWarmed ? "border-ember" : "border-white/10")} />
          <div className={cn("absolute bottom-8 left-8 size-8 border-b border-l transition-colors", isWarmed ? "border-ember" : "border-white/10")} />
          <div className={cn("absolute bottom-8 right-8 size-8 border-b border-r transition-colors", isWarmed ? "border-ember" : "border-white/10")} />
        </div>

        {/* Right Panel */}
        <div className="border-l border-white/5 p-8 flex flex-col gap-8 bg-black/20">
          <div className="space-y-4">
            <span className="text-[8px] tracking-[0.4em] text-white/20 uppercase block border-b border-white/5 pb-2">GOAP Directive</span>
            <div className="space-y-1">
              <div className="text-[8px] text-white/60 tracking-wider">DIRECTIVE: FORGE_CONFIRM</div>
              <div className="text-[8px] text-white/40 tracking-wider">ACTIVE_GOAL: MESH_VERIFICATION</div>
              <div className={cn("text-[8px] tracking-wider", isWarmed ? "text-green-500" : "text-white/20")}>
                ORACLE_NODE: {isWarmed ? 'ACTIVE' : 'QUERYING'}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <span className="text-[8px] tracking-[0.4em] text-white/20 uppercase block border-b border-white/5 pb-2">Memory Slots</span>
            <div className="space-y-2">
              {['LOCOMOTION_A', 'COMBAT_PRIME', 'TACTICS_V4', 'SURVIVAL_DIR'].map(slot => (
                <div key={slot} className="flex justify-between items-center p-2 bg-white/5 border border-white/5">
                  <span className="text-[8px] text-white/40 tracking-wider">{slot}</span>
                  <span className={cn("text-[8px] font-bold transition-colors", isWarmed ? "text-green-500" : "text-white/10")}>
                    {isWarmed ? "LOCKED" : "SCANNING"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="h-32 border-t border-white/5 grid grid-cols-[1fr_2fr_1fr] items-center px-8 bg-black/80 backdrop-blur-md z-30">
        <div className="status-block">
          <div className="progress-label mb-2 text-[8px] tracking-[0.3em] text-white/40 uppercase">{bootLabel}</div>
          <div className="h-1 w-full bg-white/5 relative overflow-hidden">
            <div className="h-full bg-ember shadow-[0_0_8px_#c8570a] transition-all duration-300" style={{ width: `${bootProgress}%` }} />
          </div>
        </div>

        <div id="confirm-readout" className="flex flex-col items-center gap-4">
          <div className={cn(
            "font-headline text-xs tracking-[0.5em] transition-all duration-1000 uppercase",
            showDeploy ? "text-green-500 drop-shadow-[0_0_10px_rgba(42,255,122,0.5)]" : "text-white/20"
          )}>
            {showDeploy ? 'Forge Atom — Signal Confirmed' : 'Cold — Awaiting Signal'}
          </div>
          <Button 
            onClick={onLaunch}
            className={cn(
              "h-10 px-8 rounded-none border border-ember bg-void text-ember hover:bg-ember hover:text-void transition-all duration-500 font-headline text-[10px] tracking-[0.4em] uppercase",
              showDeploy ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
            )}
          >
            [ Deploy Operative ]
          </Button>
        </div>

        <div className="flex flex-col justify-end h-full py-4 gap-1 text-[8px] text-white/20">
          {logs.map((l, i) => (
            <div key={i} className={cn("animate-in slide-in-from-bottom-1", l.type === 'ok' && "text-green-500/60", l.type === 'warn' && "text-ember")}>
              [{new Date().toLocaleTimeString([], { hour12: false })}] {l.msg}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
