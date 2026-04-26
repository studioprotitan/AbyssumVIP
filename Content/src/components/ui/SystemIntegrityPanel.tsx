/**
 * SystemIntegrityPanel.tsx - v3
 * Phase 8.5 | SSOT & MOAI Compliant
 * Location: src/components/ui/SystemIntegrityPanel.tsx
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export type SystemStatus = 'CONFIRMED' | 'PENDING' | 'ERROR' | 'LOCKED';
export type SystemTier = 'render' | 'mesh' | 'state' | 'integrity';

export interface SystemNode {
  id: string;
  label: string;
  tier: SystemTier;
  status: SystemStatus;
  feedsNext?: boolean;
}

export interface SystemReport {
  nodes: SystemNode[];
  lastUpdate: number;
}

// Pilot Language Mapping (Step 7 - Staged for Green Loop)
const PILOT_MAP: Record<string, string> = {
  FORGE_ENGINE: 'DRIVE CORE',
  VISUAL_CORE: 'VISOR',
  AVATAR_MESH: 'CHASSIS',
  STATE_CORE: 'NERVE LINE',
  SYNC_BRIDGE: 'RELAY',
  STABILITY_CHECK: 'RACE READY',
  CONFIRMED: 'LIVE',
  PENDING: 'WARMING',
  ERROR: 'FAULT',
  LOCKED: 'OFFLINE'
};

const TIER_ACCENT: Record<SystemTier, string> = {
  render:    'border-l-[#e87c2a]',
  mesh:      'border-l-[#a67c2a]',
  state:     'border-l-[#1a9490]',
  integrity: 'border-l-[#4a7a4a]',
};

const STATUS_COLORS: Record<SystemStatus, string> = {
  CONFIRMED: 'text-[#00ff88]',
  PENDING:   'text-[#e87c2a]',
  ERROR:     'text-[#ff4444]',
  LOCKED:    'text-[#4a4a4a]',
};

const STATIC_CHAIN: SystemNode[] = [
  { id: 'forge_engine', label: 'FORGE_ENGINE', tier: 'render', status: 'CONFIRMED', feedsNext: true },
  { id: 'visual_core', label: 'VISUAL_CORE', tier: 'render', status: 'CONFIRMED', feedsNext: true },
  { id: 'avatar_mesh', label: 'AVATAR_MESH', tier: 'mesh', status: 'CONFIRMED', feedsNext: true },
  { id: 'state_core', label: 'STATE_CORE', tier: 'state', status: 'CONFIRMED', feedsNext: true },
  { id: 'sync_bridge', label: 'SYNC_BRIDGE', tier: 'state', status: 'CONFIRMED', feedsNext: true },
  { id: 'stability_check', label: 'STABILITY_CHECK', tier: 'integrity', status: 'CONFIRMED', feedsNext: false },
];

export function SystemIntegrityPanel({ report }: { report?: SystemReport }) {
  const activeNodes = report?.nodes || STATIC_CHAIN;
  const isOperator = !!report; // If report is passed, we show Operator or Pilot view

  return (
    <div className="w-full select-none">
      <p className="font-mono text-[9px] tracking-[0.25em] text-[#4a4040] uppercase mb-[10px]">
        SYSTEM INTEGRITY {isOperator ? '• LIVE' : '• BOOT'}
      </p>

      <div className="flex flex-col">
        {activeNodes.map((node, idx) => (
          <div key={node.id}>
            <div
              className={cn(
                'flex items-center justify-between',
                'px-[8px] py-[6px]',
                'border border-[#2e2418] border-l-[2px]',
                TIER_ACCENT[node.tier],
                'bg-[#0d0b08]',
              )}
            >
              <div className="flex flex-col gap-[1px]">
                {/* Tiers are internal only - hidden in Pilot view post-boot */}
                {!isOperator && (
                  <span className="font-mono text-[8px] tracking-[0.2em] opacity-60 text-white/50 uppercase">
                    {node.tier}
                  </span>
                )}
                <span className="font-mono text-[11px] text-[#e87c2a] tracking-[0.05em]">
                  {isOperator ? node.label : (PILOT_MAP[node.label] || node.label)}
                </span>
              </div>

              <span className={cn('font-mono text-[9px] tracking-[0.15em]', STATUS_COLORS[node.status])}>
                {isOperator ? node.status : (PILOT_MAP[node.status] || node.status)}
              </span>
            </div>

            {node.feedsNext && idx < activeNodes.length - 1 && (
              <div className="flex items-center justify-start pl-[6px] h-[10px]">
                <div className="flex flex-col items-center">
                  <div className="w-px h-[6px] bg-[#2e2418]" />
                  <div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-t-[4px] border-t-[#2e2418]" />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default SystemIntegrityPanel;