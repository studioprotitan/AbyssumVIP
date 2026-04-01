'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Terminal, Cpu, Database, BrainCircuit, Radio, ShieldCheck, ChevronRight } from 'lucide-react';

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

  const log = (msg: string, type: 'info' | 'ok' | 'warn' = 'info') => {
    setLogs(prev => [...prev, { msg, type }].slice(-6));
  };

  useEffect(() => {
    const sequence = async () => {
      log('ABYSSUM GATEWAY FORGE CONFIRM — BOOT INITIATED', 'info');
      
      await new Promise(r => setTimeout(r, 800));
      setConfirmedChecks(prev => [...prev, 'chk-babylon']);
      log('Babylon.js engine initialized', 'ok');
      setBootProgress(16);
      setBootLabel('ENGINE_READY');

      await new Promise(r => setTimeout(r, 800));
      setConfirmedChecks(prev => [...prev, 'chk-webgl']);
      log('WebGL2 context confirmed', 'ok');
      setBootProgress(32);
      setBootLabel('GPU_SYNC_ACTIVE');

      await new Promise(r => setTimeout(r, 800));
      setConfirmedChecks(prev => [...prev, 'chk-mesh']);
      log('FORGE_MESH present in scene graph', 'ok');
      setBootProgress(48);
      setBootLabel('WARMING_CORE');
      setIsWarmed(true);
      onWarmUp?.(true);

      await new Promise(r => setTimeout(r, 800));
      setConfirmedChecks(prev => [...prev, 'chk-ssot']);
      log('SSOT authority confirmed', 'ok');
      setBootProgress(64);
      setBootLabel('SSOT_LOCKED');

      await new Promise(r => setTimeout(r, 800));
      setConfirmedChecks(prev => [...prev, 'chk-moai']);
      log('MOAI bridge active', 'ok');
      setBootProgress(80);
      setBootLabel('BROADCASTING');

      await new Promise(r => setTimeout(r, 800));
      setConfirmedChecks(prev => [...prev, 'chk-sentinel']);
      log('SENTINEL drift check — NOMINAL', 'ok');
      setBootProgress(100);
      setBootLabel('ALL_SYSTEMS_GREEN');
      setShowDeploy(true);
    };

    sequence();
  }, [onWarmUp]);

  const systems = [
    { id: 'chk-babylon', name: 'BABYLON_ENGINE', icon: Cpu },
    { id: 'chk-webgl', name: 'WEBGL2_CONTEXT', icon: Terminal },
    { id: 'chk-mesh', name: 'FORGE_MESH', icon: Database },
    { id: 'chk-ssot', name: 'SSOT_AUTHORITY', icon: ShieldCheck },
    { id: 'chk-moai', name: 'MOAI_BRIDGE', icon: Radio },
    { id: 'chk-sentinel', name: 'SENTINEL_DRIFT', icon: BrainCircuit },
  ];

  return (
    <div className="absolute inset-0 z-40 bg-void-dark font-code flex flex-col overflow-hidden">
      {/* Overlays */}
      <div className="absolute inset-0 pointer-events-none scanline opacity-30 z-50" />
      <div className="absolute inset-0 pointer-events-none noise-grain z-40" />

      {/* Header */}
      <div className="h-14 border-b border-white/5 flex items-center justify-between px-8 bg-black/80 backdrop-blur-sm z-30">
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
              {['ENGINE: Babylon.js v7.54.3', 'RENDERER: WebGL2', 'SHADER: PARALLEL'].map((t, i) => (
                <div key={i} className="text-[8px] text-white/40 tracking-wider transition-all duration-500">{t}</div>
              ))}
              {isWarmed && (
                <div className="text-[8px] text-ember tracking-wider animate-pulse">CORE_WARM: EMISSION_MAX</div>
              )}
            </div>
          </div>
        </div>

        {/* Center Canvas Area (Managed by SceneView in parent) */}
        <div className="relative">
          <div className={cn("absolute inset-0 border border-white/5 transition-colors duration-1000 m-4", isWarmed && "border-ember/20")} />
          <div className="absolute top-8 left-8 size-8 border-t border-l border-white/10" />
          <div className="absolute top-8 right-8 size-8 border-t border-r border-white/10" />
          <div className="absolute bottom-8 left-8 size-8 border-b border-l border-white/10" />
          <div className="absolute bottom-8 right-8 size-8 border-b border-r border-white/10" />
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
                  <span className="text-[8px] text-green-500/60 font-bold">LOCKED</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="h-32 border-t border-white/5 grid grid-cols-[1fr_2fr_1fr] items-center px-8 bg-black/80 backdrop-blur-md z-30">
        <div className="space-y-2">
          <div className="text-[8px] tracking-[0.3em] text-white/40 uppercase">{bootLabel}</div>
          <div className="h-1 w-full bg-white/5 relative overflow-hidden">
            <div className="h-full bg-ember transition-all duration-500" style={{ width: `${bootProgress}%` }} />
          </div>
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className={cn(
            "font-headline text-xs tracking-[0.5em] transition-all duration-1000 uppercase",
            showDeploy ? "text-green-500" : "text-white/20"
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
