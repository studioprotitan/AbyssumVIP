/**
 * SystemIntegrityPanel.tsx
 * Arenas of Echelon — Left Panel Compliance Patch
 * Phase 8.5 | Simpro Titans Studio, LLC
 *
 * CORRECT FILE PATH:
 *   E:\AbyssumVIP\Content\src\components\ui\SystemIntegrityPanel.tsx
 *
 * The file was at src\UI\ which is OUTSIDE the Next.js project scope.
 * TypeScript cannot resolve @/ path aliases or react/jsx-runtime from there.
 * Moving to src\components\ui\ resolves all 26 TS errors simultaneously:
 *   - TS2307 Cannot find module '@/lib/utils'
 *   - TS2875 react/jsx-runtime not found
 *   - TS7026 JSX element implicitly has type 'any' (all instances)
 *
 * No code changes required — only file location.
 *
 * CHANGES FROM v1:
 *   BABYLON_ENGINE  → FORGE_ENGINE    (tech stack stripped)
 *   WEBGL2_CONTEXT  → VISUAL_CORE     (tech stack stripped)
 *   FORGE_MESH      → AVATAR_MESH     (neutral game language)
 *   Flat badge list → Dependency chain with tier indicators
 *   Relationship: RENDER → MESH → STATE → WATCH
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────────

type SystemTier   = 'render' | 'mesh' | 'state' | 'integrity';
type SystemStatus = 'CONFIRMED' | 'PENDING' | 'ERROR' | 'LOCKED';

interface SystemNode {
  id:        string;
  label:     string;
  tier:      SystemTier;
  status:    SystemStatus;
  feedsNext?: boolean;
}

// ── Dependency chain — order is load/feed order ───────────────

const SYSTEM_CHAIN: SystemNode[] = [
  { id: 'forge_engine',    label: 'FORGE_ENGINE',    tier: 'render',    status: 'CONFIRMED', feedsNext: true  },
  { id: 'visual_core',    label: 'VISUAL_CORE',      tier: 'render',    status: 'CONFIRMED', feedsNext: true  },
  { id: 'avatar_mesh',    label: 'AVATAR_MESH',      tier: 'mesh',      status: 'CONFIRMED', feedsNext: true  },
  { id: 'state_core',     label: 'STATE_CORE',       tier: 'state',     status: 'CONFIRMED', feedsNext: true  },
  { id: 'sync_bridge',    label: 'SYNC_BRIDGE',      tier: 'state',     status: 'CONFIRMED', feedsNext: true  },
  { id: 'stability_check',label: 'STABILITY_CHECK',  tier: 'integrity', status: 'CONFIRMED', feedsNext: false },
];

// ── Tier accent colors (left border + text) ───────────────────

const TIER_ACCENT: Record<SystemTier, string> = {
  render:    'border-l-[#e87c2a]',
  mesh:      'border-l-[#a67c2a]',
  state:     'border-l-[#1a9490]',
  integrity: 'border-l-[#4a7a4a]',
};

const TIER_LABEL: Record<SystemTier, string> = {
  render:    'RENDER',
  mesh:      'MESH',
  state:     'STATE',
  integrity: 'WATCH',
};

const TIER_TEXT: Record<SystemTier, string> = {
  render:    'text-[#e87c2a]',
  mesh:      'text-[#a67c2a]',
  state:     'text-[#1a9490]',
  integrity: 'text-[#4a7a4a]',
};

const STATUS_TEXT: Record<SystemStatus, string> = {
  CONFIRMED: 'text-[#00ff88]',
  PENDING:   'text-[#e87c2a]',
  ERROR:     'text-[#ff4444]',
  LOCKED:    'text-[#4a4a4a]',
};

// ── Sub-components ────────────────────────────────────────────

function StatusBadge({ status }: { status: SystemStatus }) {
  return (
    <span className={cn('font-mono text-[9px] tracking-[0.15em]', STATUS_TEXT[status])}>
      {status}
    </span>
  );
}

function TierMarker({ tier }: { tier: SystemTier }) {
  return (
    <span className={cn('font-mono text-[8px] tracking-[0.2em] opacity-60', TIER_TEXT[tier])}>
      {TIER_LABEL[tier]}
    </span>
  );
}

// Feed connector — thin vertical line + downward chevron
// Shows that one node feeds the next in the dependency chain.
// Uses Tailwind border trick instead of inline style to satisfy
// the Edge Tools "no-inline-styles" lint hint.
function FeedConnector() {
  return (
    <div className="flex items-center justify-start pl-[6px] h-[10px]">
      <div className="flex flex-col items-center">
        <div className="w-px h-[6px] bg-[#2e2418]" />
        {/* Chevron via borders — no inline style needed */}
        <div className="w-0 h-0 border-l-[3px] border-r-[3px] border-t-[4px] border-l-transparent border-r-transparent border-t-[#2e2418]" />
      </div>
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────

export function SystemIntegrityPanel() {
  return (
    <div className="w-full">
      <p className="font-mono text-[9px] tracking-[0.25em] text-[#4a4040] uppercase mb-[10px]">
        SYSTEM INTEGRITY
      </p>

      <div className="flex flex-col">
        {SYSTEM_CHAIN.map((node, idx) => (
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
                <TierMarker tier={node.tier} />
                <span className="font-mono text-[11px] text-[#e87c2a] tracking-[0.05em]">
                  {node.label}
                </span>
              </div>
              <StatusBadge status={node.status} />
            </div>

            {node.feedsNext && idx < SYSTEM_CHAIN.length - 1 && (
              <FeedConnector />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default SystemIntegrityPanel;
