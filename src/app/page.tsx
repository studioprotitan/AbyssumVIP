
'use client';

import React from 'react';
import { SceneView } from '@/components/game/SceneView';
import { HUD } from '@/components/ui/HUD';
import { LandingScreen } from '@/components/ui/LandingScreen';
import { QTEOverlay } from '@/components/ui/QTEOverlay';
import { useGameEngine } from '@/hooks/use-game-engine';
import { PhaseState } from '@/lib/game/types';
import { Toaster } from '@/components/ui/toaster';
import { Loader2, BrainCircuit, AlertTriangle } from 'lucide-react';

export default function Home() {
  const {
    phase,
    stats,
    qteActive,
    behaviors,
    oracleIntel,
    startLaunch,
    handleQTEResult,
    injectSkill
  } = useGameEngine();

  return (
    <main className="relative w-screen h-screen bg-void-dark">
      {/* 3D Core */}
      <SceneView phase={phase} stats={stats} />

      {/* Loading Screen Overlay */}
      {phase === PhaseState.LOADING && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-void-dark gap-8">
          <div className="relative">
            <div className="absolute inset-0 blur-xl bg-ember/20 rounded-full animate-pulse" />
            <Loader2 className="size-24 text-ember animate-spin stroke-[1px]" />
          </div>
          <div className="text-center space-y-2">
            <h2 className="font-headline text-3xl text-ember uppercase tracking-[0.3em] animate-pulse">
              Calibrating Brain
            </h2>
            <p className="font-code text-xs text-ember/40">ORACLE NODE CONNECTING... [GOAP ACTIVE]</p>
          </div>
        </div>
      )}

      {/* Landing Phase UI */}
      {phase === PhaseState.LANDING && !qteActive && (
        <LandingScreen onLaunch={startLaunch} />
      )}

      {/* QTE Layer */}
      <QTEOverlay active={qteActive} onResult={handleQTEResult} />

      {/* Persistent HUD */}
      <HUD phase={phase} stats={stats} onInjectSkill={injectSkill} />

      {/* Oracle Guidance & AI Behaviors Overlay */}
      {phase === PhaseState.STREAMING && (
        <>
          {/* Top Left Oracle Assessment */}
          {oracleIntel && (
            <div className="absolute top-32 left-8 z-30 max-w-sm p-4 bg-void/80 border-l-2 border-primary backdrop-blur-md animate-in slide-in-from-left-4 duration-500">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <BrainCircuit className="size-4 text-primary animate-pulse" />
                  <span className="font-code text-[10px] text-primary uppercase">Oracle Strategic Analysis</span>
                </div>
                {stats.hazardDetected && <AlertTriangle className="size-3 text-destructive animate-bounce" />}
              </div>
              <p className="font-body text-xs text-ember/80 italic leading-relaxed">
                "{oracleIntel.riskAssessment}"
              </p>
            </div>
          )}

          {/* Bottom Left GOAP Action Intent */}
          {behaviors.length > 0 && (
            <div className="absolute bottom-32 left-8 z-30 max-w-xs space-y-1 animate-in slide-in-from-left-4 fade-in duration-500">
              <span className="font-code text-[10px] text-ember/40 uppercase">Avatar Intent Proposed</span>
              <div className="p-3 bg-void/60 border-l-2 border-ember backdrop-blur-md">
                <p className="font-headline text-sm text-ember uppercase">
                  Action: {behaviors[0].name}
                </p>
                <div className="flex justify-between items-center mt-1">
                  <p className="font-body text-[10px] text-ember/60">
                    Weight: {behaviors[0].signalPulseWeight.toFixed(2)} | Directive: {stats.activeDirective}
                  </p>
                  <div className="size-1.5 rounded-full bg-primary animate-pulse" />
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Post-Process Film Grain / Glitch Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[url('https://picsum.photos/seed/noise/1024/1024')] bg-repeat mix-blend-overlay" />
      
      <Toaster />
    </main>
  );
}
