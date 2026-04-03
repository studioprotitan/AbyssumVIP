'use client';

import React from 'react';
import { SystemIntegrityPanel } from './SystemIntegrityPanel';

/**
 * OperatorPanel.tsx
 * Operator layer — not visible in public pilot UX
 * Access: Gear Icon → Advanced Settings
 * Lock status: LOCKED before ship
 */
export function OperatorPanel({ report, isUnlocked }: {
  report?: any;
  isUnlocked: boolean;
}) {
  if (!isUnlocked) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-void/95 backdrop-blur-2xl flex items-center justify-center p-12">
      <div className="max-w-4xl w-full flex flex-col gap-6">
        <div className="flex justify-between items-end border-b border-ember/20 pb-4">
          <div className="space-y-1">
            <h1 className="font-headline text-2xl text-ember uppercase">Operator Terminal</h1>
            <p className="font-code text-[10px] text-ember/40">Build v1.6.0-Phase8.5 // Internal Diagnostic Overlay</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-4">
            <p className="font-code text-xs text-ember/60 uppercase tracking-widest border-b border-ember/10 pb-2">
              System Integrity (Raw)
            </p>
            {/* Renders SystemIntegrityPanel with raw data in the future */}
            <SystemIntegrityPanel report={report} />
          </div>

          <div className="space-y-4">
            <p className="font-code text-xs text-ember/60 uppercase tracking-widest border-b border-ember/10 pb-2">
              Pipeline Configuration
            </p>
            <div className="p-4 bg-void/40 border border-ember/5 space-y-2">
              <div className="flex justify-between font-code text-[10px]">
                <span className="text-ember/40">MANIFEST:</span>
                <span className="text-ember">/models/mi_manifest_dpk.json</span>
              </div>
              <div className="flex justify-between font-code text-[10px]">
                <span className="text-ember/40">BABYLON:</span>
                <span className="text-ember">v7.x</span>
              </div>
              <div className="flex justify-between font-code text-[10px]">
                <span className="text-ember/40">BRIDGE:</span>
                <span className="text-green-500">85-90% STABLE</span>
              </div>
            </div>
          </div>
        </div>

        <button 
          className="self-end font-code text-[10px] text-ember border border-ember/20 px-6 py-2 hover:bg-ember/10 transition-colors"
          onClick={() => window.location.reload()}
        >
          [ CLOSE_TERMINAL ]
        </button>
      </div>
    </div>
  );
}
