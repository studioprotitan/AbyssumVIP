
'use client';

import React from 'react';
import { SystemIntegrityPanel } from './SystemIntegrityPanel';

/**
 * OperatorPanel.tsx
 * Operator layer — not visible in public pilot UX
 * Access: Gear Icon → Advanced Settings → Hidden Access
 * Lock status: LOCKED before ship
 */
export function OperatorPanel({ report, isUnlocked }: {
  report?: any;
  isUnlocked: boolean;
}) {
  if (!isUnlocked) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-void/95 backdrop-blur-2xl flex items-center justify-center p-12">
      <div className="max-w-4xl w-full flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-300">
        <div className="flex justify-between items-end border-b border-ember/20 pb-4">
          <div className="space-y-1">
            <h1 className="font-headline text-2xl text-ember uppercase">Operator Terminal</h1>
            <p className="font-code text-[10px] text-ember/40">Build v1.6.0-Phase8.5 // Internal Diagnostic Overlay</p>
          </div>
          <div className="flex gap-4">
            <div className="px-3 py-1 bg-green-500/20 border border-green-500/40 rounded text-[9px] text-green-500 font-code uppercase">
              Auth: MOAI-Confirmed
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-4">
            <p className="font-code text-xs text-ember/60 uppercase tracking-widest border-b border-ember/10 pb-2">
              System Integrity (Authoritative)
            </p>
            <SystemIntegrityPanel report={report} />
          </div>

          <div className="space-y-4">
            <p className="font-code text-xs text-ember/60 uppercase tracking-widest border-b border-ember/10 pb-2">
              Pipeline Telemetry
            </p>
            <div className="p-4 bg-void/40 border border-ember/5 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between font-code text-[10px]">
                  <span className="text-ember/40 uppercase">Manifest Authority:</span>
                  <span className="text-ember">/models/mi_manifest_dpk.json</span>
                </div>
                <div className="flex justify-between font-code text-[10px]">
                  <span className="text-ember/40 uppercase">Babylon Substrate:</span>
                  <span className="text-ember">v7.x - Stable</span>
                </div>
                <div className="flex justify-between font-code text-[10px]">
                  <span className="text-ember/40 uppercase">CDN Relay:</span>
                  <span className="text-green-500">Active - Bypass Mode</span>
                </div>
              </div>

              <div className="pt-4 border-t border-ember/5">
                <p className="font-code text-[9px] text-ember/30 uppercase mb-2">Cognitive Logs</p>
                <div className="h-40 overflow-y-auto font-code text-[8px] text-ember/50 space-y-1 custom-scrollbar">
                  <p>[04:03:26] NERVE_LINE initialized.</p>
                  <p>[04:03:26] ORACLE_AI analyzing signal pattern integrity.</p>
                  <p>[04:03:27] STABILITY_CHECK: 95.8% - NOMINAL.</p>
                  <p>[04:03:28] RELAY: Cache HIT for scene-mint-deploy-dpk-prop-clock-a.glb</p>
                  <p className="text-primary">[04:03:30] SIGNAL_MECHANIC: Proximity threshold monitored.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <button 
          className="self-end font-code text-[10px] text-ember border border-ember/20 px-8 py-2 hover:bg-ember/10 transition-colors"
          onClick={() => window.location.reload()}
        >
          [ DISMISS_TERMINAL ]
        </button>
      </div>
    </div>
  );
}
