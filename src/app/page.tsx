'use client';

import React, { useState, useEffect } from 'react';
import DieselCityScene from '@/components/scenes/DieselCityScene';
import { SystemIntegrityPanel } from '@/components/ui/SystemIntegrityPanel';
import { HUD } from '@/components/ui/HUD';
import { LandingScreen } from '@/components/ui/LandingScreen';
import { QTEOverlay } from '@/components/ui/QTEOverlay';
import { SimulationLog } from '@/components/ui/SimulationLog';
import { SystemsReport } from '@/components/ui/SystemsReport';
import { OperatorPanel } from '@/components/ui/OperatorPanel';
import { useGameEngine } from '@/hooks/use-game-engine';
import { PhaseState } from '@/lib/game/types';
import { Toaster } from '@/components/ui/toaster';
import { Loader2, Settings } from 'lucide-react';

/**
 * Arenas of Echelon - Main Entry
 * Compliance: Phase 8.5 Pilot UX
 * Fix: Suppress global extension/MetaMask errors to prevent overlay noise.
 */
export default function Home() {
  const {
    phase,
    stats,
    qteActive,
    behaviors,
    isRecording,
    showReport,
    artifactLog,
    startLaunch,
    handleQTEResult,
    injectSkill,
    toggleRecording,
    toggleReport
  } = useGameEngine();

  const [isWarmed, setIsWarmed] = useState(false);
  const [operatorUnlocked, setOperatorUnlocked] = useState(false);

  useEffect(() => {
    // Suppress noisy browser extension errors (MetaMask, etc.) in the development overlay
    const handleExtensionErrors = (event: ErrorEvent) => {
      if (
        event.message?.includes('MetaMask') || 
        event.filename?.includes('chrome-extension') ||
        event.message?.includes('inpage.js')
      ) {
        event.stopImmediatePropagation();
      }
    };

    window.addEventListener('error', handleExtensionErrors);
    return () => window.removeEventListener('error', handleExtensionErrors);
  }, []);

  return (
    <main className="relative w-screen h-screen bg-void-dark">
      {/* Pilot Visual Layer */}
      <DieselCityScene />

      {/* Grid Integrity Rail (Left) */}
      <div className="absolute top-8 left-8 w-[180px] z-20 animate-in slide-in-from-left-4 duration-1000">
        <SystemIntegrityPanel />
      </div>

      {phase === PhaseState.LOADING && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-void-dark gap-8">
          <div className="relative">
            <div className="absolute inset-0 blur-xl bg-ember/20 rounded-full animate-pulse" />
            <Loader2 className="size-24 text-ember animate-spin stroke-[1px]" />
          </div>
          <div className="text-center space-y-2">
            <h2 className="font-headline text-3xl text-ember uppercase tracking-[0.3em] animate-pulse">
              PREPARING FOR GRID ENTRY
            </h2>
            <p className="font-code text-xs text-ember/40">CORE SYNC CONNECTING... [NODE ACTIVE]</p>
          </div>
        </div>
      )}

      {phase === PhaseState.LANDING && !qteActive && (
        <LandingScreen 
          onLaunch={startLaunch} 
          onWarmUp={setIsWarmed} 
        />
      )}

      <QTEOverlay active={qteActive} onResult={handleQTEResult} />

      <HUD 
        phase={phase} 
        stats={stats} 
        activeAction={behaviors[0]?.name}
        onInjectSkill={injectSkill} 
        isRecording={isRecording}
        onToggleRecording={toggleRecording}
        onToggleReport={toggleReport}
      />

      <SimulationLog logs={artifactLog} active={isRecording && phase === PhaseState.STREAMING} />

      <SystemsReport 
        active={showReport} 
        stats={stats} 
        onClose={toggleReport} 
      />

      {/* Operator Gear - Hidden Access */}
      <button 
        className="absolute bottom-8 right-8 z-[90] opacity-10 hover:opacity-100 transition-opacity p-2 text-ember"
        onClick={() => setOperatorUnlocked(true)}
      >
        <Settings className="size-4" />
      </button>

      <OperatorPanel isUnlocked={operatorUnlocked} />

      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[url('https://picsum.photos/seed/noise/1024/1024')] bg-repeat mix-blend-overlay" />
      
      <Toaster />
    </main>
  );
}
