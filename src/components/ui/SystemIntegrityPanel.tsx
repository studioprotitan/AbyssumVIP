'use client';

import React from 'react';
import { cn } from '@/lib/utils';

/**
 * SystemIntegrityPanel.tsx — v3 (Pilot UX)
 * Implements Phase 8.5 Tiered Dependency Hierarchy and Pilot Language Mapping.
 * Remaps technical identifiers to immersive pilot world strings.
 */

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

type SystemTier = 'RENDER' | 'MESH' | 'STATE' | 'WATCH';

interface SystemNode {
  id: string;
  label: string;
  tier: SystemTier;
  status: 'CONFIRMED' | 'PENDING' | 'ERROR' | 'LOCKED';
  feedsNext?: boolean;
}

const SYSTEM_CHAIN: SystemNode[] = [
  { id: '1', label: 'FORGE_ENGINE', tier: 'RENDER', status: 'CONFIRMED', feedsNext: true },
  { id: '2', label: 'VISUAL_CORE', tier: 'RENDER', status: 'CONFIRMED', feedsNext: true },
  { id: '3', label: 'AVATAR_MESH', tier: 'MESH', status: 'CONFIRMED', feedsNext: true },
  { id: '4', label: 'STATE_CORE', tier: 'STATE', status: 'CONFIRMED', feedsNext: true },
  { id: '5', label: 'SYNC_BRIDGE', tier: 'STATE', status: 'CONFIRMED', feedsNext: true },
  { id: '6', label: 'STABILITY_CHECK', tier: 'WATCH', status: 'CONFIRMED', feedsNext: false },
];

const TIER_COLORS: Record<SystemTier, string> = {
  RENDER: 'border-l-ember bg-ember/5',
  MESH: 'border-l-primary/60 bg-primary/5',
  STATE: 'border-l-secondary bg-secondary/5',
  WATCH: 'border-l-green-500 bg-green-500/5',
};

function FeedConnector() {
  return (
    <div className="flex items-center justify-start pl-2 h-3">
      <div className="w-px h-full bg-border/40 relative">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-t-[4px] border-t-border/40" />
      </div>
    </div>
  );
}

export function SystemIntegrityPanel() {
  return (
    <div className="flex flex-col gap-1 p-2 bg-void/80 border border-ember/20 backdrop-blur-md">
      <p className="font-code text-[8px] text-ember/40 uppercase tracking-[0.25em] mb-2 px-1">
        Grid Integrity Matrix
      </p>
      <div className="flex flex-col">
        {SYSTEM_CHAIN.map((node, idx) => (
          <React.Fragment key={node.id}>
            <div className={cn(
              "flex items-center justify-between p-2 border-l-2 transition-all duration-300",
              TIER_COLORS[node.tier]
            )}>
              <div className="flex flex-col">
                <span className="font-code text-[7px] tracking-widest opacity-40 uppercase">
                  {node.tier}
                </span>
                <span className="font-headline text-[10px] text-ember uppercase tracking-wider">
                  {PILOT_MAP[node.label] || node.label}
                </span>
              </div>
              <span className={cn(
                "font-code text-[9px] font-bold tracking-widest",
                node.status === 'CONFIRMED' ? "text-green-500" : "text-ember/40"
              )}>
                {PILOT_MAP[node.status] || node.status}
              </span>
            </div>
            {node.feedsNext && idx < SYSTEM_CHAIN.length - 1 && <FeedConnector />}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
