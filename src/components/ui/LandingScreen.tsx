'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SystemIntegrityPanel } from './SystemIntegrityPanel';

interface LandingScreenProps {
  onLaunch: () => void;
  onWarmUp?: (isWarmed: boolean) => void;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({ onLaunch, onWarmUp }) => {
  const [bootProgress, setBootProgress] = useState(0);
  const [bootLabel, setBootLabel] = useState('PREPARING FOR GRID ENTRY');
  const [isWarmed, setIsWarmed] = useState(false);
  const [showDeploy, setShowDeploy] = useState(false);
  const [logs, setLogs] = useState<{ msg: string; type: 'info' | 'ok' | 'warn' }[]>([]);

  const log = (msg: string, type: 'info' | 'ok' | 'warn' = 'info') => {
    setLogs(prev => [...prev, { msg, type }].slice(-6));
  };

  useEffect(() => {
    const sequence = async () => {
      log('ABYSSUM GATEWAY FORGE CONFIRM — BOOT INITIATED', 'info');
      
      const interval = setInterval(() => {
        setBootProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 1;
        });
      }, 50);

      setTimeout(() => {
        log('DRIVE CORE substrate initialized', 'ok');
      }, 1000);

      setTimeout(() => {
        log('VISOR context verified', 'ok');
      }, 2000);

      setTimeout(() => {
        log('CHASSIS verified', 'ok');
        setIsWarmed(true);
        onWarmUp?.(true);
      }, 3000);

      setTimeout(() => {
        log('NERVE LINE authority locked', 'ok');
      }, 4000);

      setTimeout(() => {
        setBootLabel('RACE READY — PILOT CONFIRMED');
        setShowDeploy(true);
        log('RACE READY — SIGNAL PULSE STABLE', 'ok');
      }, 5500);

      return () => clearInterval(interval);
    };

    sequence();
  }, [onWarmUp]);

  return (
    <div className="absolute inset-0 z-40 bg-void-dark font-code flex flex-col overflow-hidden">
      <div className="absolute inset-0 pointer-events-none scanline opacity-30 z-50 animate-pulse-ember" />
      <div className="absolute inset-0 pointer-events-none noise-grain z-40" />

      {/* Top Header */}
      <div className={cn(
        "h-14 border-b border-white/5 flex items-center justify-between px-4 md:px-8 bg-black/80 backdrop-blur-sm z-30 transition-colors duration-1000",
        isWarmed && "border-ember/20"
      )}>
        <div className="font-headline text-[8px] md:text-[10px] tracking-[0.2em] md:tracking-[0.4em] text-white/40 uppercase">Abyssum Gateway</div>
        <div className="hidden sm:block text-[8px] md:text-[10px] tracking-[0.3em] text-white/20 uppercase">Forge Confirm // Phase 8.5</div>
        <div className="text-[8px] md:text-[10px] tracking-[0.2em] text-white/40">{new Date().toLocaleTimeString()}</div>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-[320px_1fr_280px] z-20 overflow-hidden">
        {/* Left Panel: Integrity Hierarchy - Hidden on mobile */}
        <div className="hidden md:block border-r border-white/5 p-6 bg-black/20 overflow-y-auto">
          <SystemIntegrityPanel />
        </div>

        {/* Center: Targeting/Visuals */}
        <div className="relative flex items-center justify-center p-4">
          <div className={cn(
            "size-[260px] md:size-[300px] border border-dashed border-white/20 rounded-full animate-spin duration-[20s]",
            isWarmed && "animate-console-breathe opacity-40"
          )} />
          <div className={cn(
            "absolute size-[100px] md:size-[140px] border border-ember/20 rounded-full animate-pulse flex items-center justify-center",
            isWarmed ? "opacity-100" : "opacity-20"
          )}>
            <div className="size-2 bg-ember rounded-full animate-ping" />
          </div>
          
          {/* Mobile-only Integrity Info */}
          <div className="absolute top-4 left-4 md:hidden opacity-40 scale-75 origin-top-left">
             <div className="text-[8px] text-ember uppercase font-bold tracking-widest">Grid Status: {isWarmed ? 'ACTIVE' : 'QUERYING'}</div>
          </div>
        </div>

        {/* Right Panel: Operative Status - Hidden on mobile */}
        <div className="hidden md:block border-l border-white/5 p-6 bg-black/20 space-y-8">
          <div className="space-y-4">
            <span className="text-[8px] tracking-[0.4em] text-white/20 uppercase block border-b border-white/5 pb-2">Directive</span>
            <div className="space-y-2">
              <div className="text-[10px] text-ember uppercase">Node: {isWarmed ? 'ACTIVE' : 'QUERYING'}</div>
              <div className="text-[10px] text-white/40 uppercase">Subsystem: {isWarmed ? 'READY' : 'COLD'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Boot Progress */}
      <div className="min-h-32 border-t border-white/5 flex flex-col md:grid md:grid-cols-[1fr_2fr_1fr] items-center px-4 md:px-8 py-4 bg-black/80 backdrop-blur-md z-30 gap-4">
        {/* Progress Bar (Visible on all) */}
        <div className="w-full max-w-sm md:max-w-none flex flex-col gap-2">
          <div className="text-[8px] tracking-[0.3em] text-white/40 uppercase text-center md:text-left">{bootLabel}</div>
          <div className="h-1 w-full bg-white/5 relative overflow-hidden">
            <div className="h-full bg-ember shadow-[0_0_8px_#c8570a] transition-all duration-300" style={{ width: `${bootProgress}%` }} />
          </div>
        </div>

        {/* Action Button (Centered) */}
        <div className="flex flex-col items-center justify-center gap-4 w-full">
          <Button 
            onClick={onLaunch}
            className={cn(
              "h-12 md:h-10 px-8 rounded-none border border-ember bg-void text-ember hover:bg-ember hover:text-void transition-all duration-500 font-headline text-[10px] tracking-[0.4em] uppercase w-full max-w-[280px] md:w-auto",
              showDeploy ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
            )}
          >
            [ ENTER THE GRID ]
          </Button>
        </div>

        {/* System Logs (Hidden on very small mobile) */}
        <div className="hidden sm:flex flex-col justify-end gap-1 text-[8px] text-white/20 w-full text-right overflow-hidden h-12">
          {logs.map((l, i) => (
            <div key={i} className={cn("animate-in slide-in-from-bottom-1", l.type === 'ok' && "text-green-500/60")}>
              [{new Date().toLocaleTimeString([], { hour12: false })}] {l.msg}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
