
'use client';

import React from 'react';
import { cn } from '@/lib/utils';

/**
 * SystemIntegrityPanel.tsx — v3 (Pilot UX)
 * Phase 8.5 | Simpro Titans Studio, LLC
 * 
 * Remaps technical identifiers to Pilot Language:
 * - FORGE_ENGINE    → DRIVE CORE
 * - VISUAL_CORE     → VISOR
 * - AVATAR_MESH     → CHASSIS
 * - STATE_CORE      → NERVE LINE
 * - SYNC_BRIDGE     → RELAY
 * - STABILITY_CHECK → RACE READY
 */

type SystemTier = 'render' | 'mesh' | 'state' | 'integrity';
type SystemStatus = 'CONFIRMED' | 'PENDING' | 'ERROR' | 'LOCKED';

interface SystemNode {
  id: string;
  label: string;
  pilotLabel: string;
  tier: SystemTier;
  status: SystemStatus;
  feedsNext?: boolean;
}

const SYSTEM_CHAIN: SystemNode[] = [
  {
    id: 'forge_engine',
    label: 'FORGE_ENGINE',
    pilotLabel: 'DRIVE CORE',
    tier: 'render',
    status: 'CONFIRMED',
    feedsNext: true,
  },
  {
    id: 'visual_core',
    label: 'VISUAL_CORE',
    pilotLabel: 'VISOR',
    tier: 'render',
    status: 'CONFIRMED',
    feedsNext: true,
  },
  {
    id: 'avatar_mesh',
    label: 'AVATAR_MESH',
    pilotLabel: 'CHASSIS',
    tier: 'mesh',
    status: 'CONFIRMED',
    feedsNext: true,
  },
  {
    id: 'state_core',
    label: 'STATE_CORE',
    pilotLabel: 'NERVE LINE',
    tier: 'state',
    status: 'CONFIRMED',
    feedsNext: true,
  },
  {
    id: 'sync_bridge',
    label: 'SYNC_BRIDGE',
    pilotLabel: 'RELAY',
    tier: 'state',
    status: 'CONFIRMED',
    feedsNext: true,
  },
  {
    id: 'stability_check',
    label: 'STABILITY_CHECK',
    pilotLabel: 'RACE READY',
    tier: 'integrity',
    status: 'CONFIRMED',
    feedsNext: false,
  },
];

const TIER_ACCENT: Record<SystemTier, string> = {
  render:    'border-l-primary',
  mesh:      'border-l-amber-500',
  state:     'border-l-secondary',
  integrity: 'border-l-green-500',
};

function StatusBadge({ status }: { status: SystemStatus }) {
  const labelMap: Record<SystemStatus, string> = {
    CONFIRMED: 'LIVE',
    PENDING: 'WARMING',
    ERROR: 'FAULT',
    LOCKED: 'OFFLINE'
  };

  return (
    <span className={cn(
      "font-code text-[9px] tracking-widest",
      status === 'CONFIRMED' ? "text-green-500" : "text-ember/40"
    )}>
      {labelMap[status] || status}
    </span>
  );
}

function FeedConnector() {
  return (
    <div className="flex items-center justify-start pl-[6px] h-[8px]">
      <div className="w-px h-full bg-ember/10 relative">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-t-[4px] border-t-ember/10" />
      </div>
    </div>
  );
}

export function SystemIntegrityPanel({ report }: { report?: any }) {
  return (
    <div className="w-full flex flex-col p-2 bg-void/80 border border-ember/20 backdrop-blur-md">
      <p className="font-code text-[8px] tracking-[0.25em] text-ember/40 uppercase mb-2 px-1">
        GRID INTEGRITY
      </p>

      <div className="flex flex-col">
        {SYSTEM_CHAIN.map((node, idx) => (
          <React.Fragment key={node.id}>
            <div className={cn(
              "flex items-center justify-between p-2 border-l-2 transition-all duration-300",
              TIER_ACCENT[node.tier],
              "bg-void/40 border-y border-r border-white/5"
            )}>
              <span className="font-headline text-[10px] text-ember uppercase tracking-wider">
                {node.pilotLabel}
              </span>
              <StatusBadge status={node.status} />
            </div>
            {node.feedsNext && idx < SYSTEM_CHAIN.length - 1 && <FeedConnector />}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

export default SystemIntegrityPanel;
