'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { OperatorStats } from '@/lib/game/types';

/**
 * SystemIntegrityPanel.tsx - v3 (Pilot UX)
 * Implements Phase 8.5 Pilot Language Mapping
 */

// Pilot Language Mapping Table
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

type SystemTier = 'DRIVE' | 'VISION' | 'BODY' | 'CORE' | 'SYNC' | 'WATCH';

interface SystemNode {
  id: string;
  label: string;
  tier: SystemTier;
  status: 'CONFIRMED' | 'PENDING' | 'ERROR' | 'LOCKED';
}

interface SystemIntegrityPanelProps {
  report?: any; // Accepting live report prop for future binding
}

export function SystemIntegrityPanel({ report }: SystemIntegrityPanelProps) {
  // Authoritative chain for Loop A
  const SYSTEM_CHAIN: SystemNode[] = [
    { id: '1', label: 'FORGE_ENGINE', tier: 'DRIVE', status: 'CONFIRMED' },
    { id: '2', label: 'VISUAL_CORE', tier: 'VISION', status: 'CONFIRMED' },
    { id: '3', label: 'AVATAR_MESH', tier: 'BODY', status: 'CONFIRMED' },
    { id: '4', label: 'STATE_CORE', tier: 'CORE', status: 'CONFIRMED' },
    { id: '5', label: 'SYNC_BRIDGE', tier: 'SYNC', status: 'CONFIRMED' },
    { id: '6', label: 'STABILITY_CHECK', tier: 'WATCH', status: 'CONFIRMED' },
  ];

  return (
    <div className="flex flex-col gap-2 p-2 bg-void/80 border border-ember/20 backdrop-blur-md">
      <p className="font-code text-[8px] text-ember/40 uppercase tracking-[0.2em] mb-1">
        Grid Integrity Matrix
      </p>
      <div className="flex flex-col gap-1">
        {SYSTEM_CHAIN.map((node) => (
          <div 
            key={node.id} 
            className="flex items-center justify-between p-2 border-l-2 border-l-ember bg-void/40 transition-all hover:bg-ember/5"
          >
            <div className="flex flex-col">
              <span className="font-headline text-[10px] text-ember uppercase tracking-wider">
                {PILOT_MAP[node.label] || node.label}
              </span>
              <span className="font-code text-[7px] text-ember/40 uppercase">
                {node.tier}
              </span>
            </div>
            <span className={cn(
              "font-code text-[9px] font-bold tracking-widest",
              node.status === 'CONFIRMED' ? "text-green-500" : "text-ember/40"
            )}>
              {PILOT_MAP[node.status] || node.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
