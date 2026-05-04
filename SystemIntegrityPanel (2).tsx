/**
 * SystemIntegrityPanel.tsx
 * Arenas of Echelon — Left Panel Compliance Patch
 * Phase 8.5 | Simpro Titans Studio, LLC
 *
 * CHANGES FROM v1:
 *  - BABYLON_ENGINE    → FORGE_ENGINE   (tech stack stripped)
 *  - WEBGL2_CONTEXT    → VISUAL_CORE    (tech stack stripped)
 *  - FORGE_MESH        → AVATAR_MESH    (neutral game language)
 *  - Flat badge list   → Dependency chain with tier indicators
 *  - Relationship order: FORGE_ENGINE feeds VISUAL_CORE feeds AVATAR_MESH
 *    feeds STATE_CORE feeds SYNC_BRIDGE feeds STABILITY_CHECK
 */

'use client';

import { cn } from '@/lib/utils';

// ── Dependency tiers ──────────────────────────────────────────────────
// RENDER SUBSTRATE  → what the scene runs on
// MESH LAYER        → what gets drawn
// STATE LAYER       → what controls behavior
// INTEGRITY LAYER   → what monitors it all

type SystemTier = 'render' | 'mesh' | 'state' | 'integrity';
type SystemStatus = 'CONFIRMED' | 'PENDING' | 'ERROR' | 'LOCKED';

interface SystemNode {
  id: string;
  label: string;
  tier: SystemTier;
  status: SystemStatus;
  /** Indicates this node feeds the one below it in the chain */
  feedsNext?: boolean;
}

const SYSTEM_CHAIN: SystemNode[] = [
  {
    id: 'forge_engine',
    label: 'FORGE_ENGINE',
    tier: 'render',
    status: 'CONFIRMED',
    feedsNext: true,
  },
  {
    id: 'visual_core',
    label: 'VISUAL_CORE',
    tier: 'render',
    status: 'CONFIRMED',
    feedsNext: true,
  },
  {
    id: 'avatar_mesh',
    label: 'AVATAR_MESH',
    tier: 'mesh',
    status: 'CONFIRMED',
    feedsNext: true,
  },
  {
    id: 'state_core',
    label: 'STATE_CORE',
    tier: 'state',
    status: 'CONFIRMED',
    feedsNext: true,
  },
  {
    id: 'sync_bridge',
    label: 'SYNC_BRIDGE',
    tier: 'state',
    status: 'CONFIRMED',
    feedsNext: true,
  },
  {
    id: 'stability_check',
    label: 'STABILITY_CHECK',
    tier: 'integrity',
    status: 'CONFIRMED',
    feedsNext: false,
  },
];

// Tier visual accent colors (Tailwind classes mapped to CSS vars)
const TIER_ACCENT: Record<SystemTier, string> = {
  render:    'border-l-[#e87c2a]',   // forge-orange — foundational substrate
  mesh:      'border-l-[#a67c2a]',   // gold — avatar geometry layer
  state:     'border-l-[#1a9490]',   // teal — state authority
  integrity: 'border-l-[#4a7a4a]',   // muted green — watchdog layer
};

const TIER_LABEL: Record<SystemTier, string> = {
  render:    'RENDER',
  mesh:      'MESH',
  state:     'STATE',
  integrity: 'WATCH',
};

// ── Status badge ──────────────────────────────────────────────────────
function StatusBadge({ status }: { status: SystemStatus }) {
  const colors: Record<SystemStatus, string> = {
    CONFIRMED: 'text-[#00ff88]',
    PENDING:   'text-[#e87c2a]',
    ERROR:     'text-[#ff4444]',
    LOCKED:    'text-[#4a4a4a]',
  };
  return (
    <span
      className={cn(
        'font-mono text-[9px] tracking-[0.15em]',
        colors[status]
      )}
    >
      {status}
    </span>
  );
}

// ── Tier marker ───────────────────────────────────────────────────────
function TierMarker({ tier }: { tier: SystemTier }) {
  const colors: Record<SystemTier, string> = {
    render:    'text-[#e87c2a]',
    mesh:      'text-[#a67c2a]',
    state:     'text-[#1a9490]',
    integrity: 'text-[#4a7a4a]',
  };
  return (
    <span
      className={cn(
        'font-mono text-[8px] tracking-[0.2em] opacity-60',
        colors[tier]
      )}
    >
      {TIER_LABEL[tier]}
    </span>
  );
}

// ── Feed connector between nodes ──────────────────────────────────────
// Thin vertical line with a downward chevron to show dependency direction
function FeedConnector() {
  return (
    <div className="flex items-center justify-start pl-[6px] h-[10px]">
      <div className="flex flex-col items-center">
        <div className="w-px h-[6px] bg-[#2e2418]" />
        <div
          className="w-0 h-0"
          style={{
            borderLeft: '3px solid transparent',
            borderRight: '3px solid transparent',
            borderTop: '4px solid #2e2418',
          }}
        />
      </div>
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────
export function SystemIntegrityPanel() {
  return (
    <div className="w-full">
      {/* Panel header */}
      <p
        className="font-mono text-[9px] tracking-[0.25em] text-[#4a4040] uppercase mb-[10px]"
      >
        SYSTEM INTEGRITY
      </p>

      {/* Dependency chain */}
      <div className="flex flex-col">
        {SYSTEM_CHAIN.map((node, idx) => (
          <div key={node.id}>
            {/* Node row */}
            <div
              className={cn(
                'flex items-center justify-between',
                'px-[8px] py-[6px]',
                'border border-[#2e2418] border-l-[2px]',
                TIER_ACCENT[node.tier],
                'bg-[#0d0b08]',
              )}
            >
              {/* Left: tier marker + label */}
              <div className="flex flex-col gap-[1px]">
                <TierMarker tier={node.tier} />
                <span className="font-mono text-[11px] text-[#e87c2a] tracking-[0.05em]">
                  {node.label}
                </span>
              </div>

              {/* Right: status */}
              <StatusBadge status={node.status} />
            </div>

            {/* Feed connector — shown between nodes, not after last */}
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
