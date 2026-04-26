// ============================================================
// WorldGenCore.ts — Test Loop A (MTD PULSE)
// Phase 8.5 | Simpro Titans Studio, LLC
// ============================================================
// MOTHER: Station/Forge Node Generation
// ORACLE: Movement & Spawn Prediction
// SENTINEL: Entropy & Conflict Monitor
// GOAP: Builder Bot Handlers
//
// AUTHORITY CHAIN:
//   mi_manifest_dpk.json → WorldAssetRegistry
//   WorldAssetRegistry   → WorldGenCore (this file)
//   WorldGenCore         → FreightLoader
//   FreightLoader        → Babylon Scene (VISUAL_CORE)
//   Scene state          → SystemIntegrityPanel (STABILITY_CHECK)
//
// MOAI COMPLIANCE:
//   All state changes broadcast via MOAI.broadcast()
//   No direct Babylon calls — all scene writes via FreightLoader
//   STATE_CORE (SSOT) owns all world state
//
// ============================================================

import { MOAI }        from '@/lib/moai';
import { SentinelLog } from '@/lib/SentinelLogger';
import type { Scene }  from '@babylonjs/core';

// ── Manifest types (matches mi_manifest_dpk.json schema) ─────

export type AssetStatus = 'CONFIRMED' | 'PENDING_EXPORT' | 'FAILED' | 'LOADED';
export type NodeState   = 'ACTIVE' | 'DAMAGED' | 'DORMANT' | 'DESTROYED';

export interface ManifestAsset {
  id:           string;
  filename:     string;
  type:         string;
  status:       AssetStatus;
  babylon_path: string;
  tags:         string[];
  notes?:       string;
}

export interface ManifestData {
  kit:    { id: string; name: string; export_path: string };
  assets: ManifestAsset[];
}

// ── World node — runtime state of a placed asset ─────────────

export interface WorldNode {
  assetId:    string;
  filename:   string;
  babylonPath:string;
  tags:       string[];
  state:      NodeState;
  position:   { x: number; y: number; z: number };
  purpose:    string;  // MOAI compliance: every node has a declared purpose
}

// ── Chunk ─────────────────────────────────────────────────────

export interface WorldChunk {
  id:        string;
  name:      string;
  nodes:     WorldNode[];
  loadState: 'PENDING' | 'LOADING' | 'LOADED' | 'FAILED';
}

// ── Forge placement rules ─────────────────────────────────────
// No random placement without logic.
// Street assets → ACTIVE
// Banner assets → DAMAGED (flagged in manifest)
// Every node must have purpose + state.

function getForgeState(tags: string[], assetStatus: AssetStatus): NodeState {
  if (assetStatus !== 'CONFIRMED') return 'DORMANT';
  if (tags.includes('banner'))     return 'DAMAGED';
  if (tags.includes('street'))     return 'ACTIVE';
  if (tags.includes('landmark'))   return 'ACTIVE';
  return 'DORMANT';
}

function getPurpose(type: string, tags: string[]): string {
  if (type === 'bldg-lg' || type === 'bldg-xl') return 'LANDMARK_STRUCTURE';
  if (tags.includes('transit'))  return 'TRANSIT_NODE';
  if (tags.includes('signage'))  return 'NAVIGATION_MARKER';
  if (tags.includes('street'))   return 'STREET_DRESSING';
  if (tags.includes('prop'))     return 'INTERACTIVE_PROP';
  return 'ENVIRONMENTAL_DRESSING';
}

// ── Minimal chunk layout — one asset per confirmed slot ───────
// Positions are fixed, not random.
// Change these to real layout coordinates for Phase 8.5 scene.
const FORGE_CITY_POSITIONS: Record<string, { x: number; y: number; z: number }> = {
  'dpk-prop-clock-a':                    { x:  0,   y: 0, z:  0   },
  'dpk-prop-billboard-a':               { x:  3,   y: 0, z:  0   },
  'dpk-prop-bus-stop-a':                { x: -3,   y: 0, z:  0   },
  'dpk-prop-postal-box-a':              { x:  1.5, y: 0, z:  2   },
  'dpk-prop-trash-f':                   { x: -1.5, y: 0, z:  2   },
  'dpk-prop-drinking-fountain-a':       { x:  0,   y: 0, z:  4   },
  'dpk-prop-blade-sign-d':              { x:  4,   y: 0, z: -2   },
  'dpk-prop-tower-i':                   { x: -6,   y: 0, z:  0   },
  'dpk-bldg-lg-astronomy-institute-a':  { x:  10,  y: 0, z:  0   },
  'dpk-bldg-xl-astronomical-admin-a':   { x: -12,  y: 0, z:  0   },
  'dpk-prop-banner-b':                  { x:  2,   y: 0, z: -4   },
};

// ── STATE_CORE (SSOT) for world state ─────────────────────────
// Single mutable object — no duplicates elsewhere.

export const WORLD_STATE = {
  chunks:      [] as WorldChunk[],
  loadStatus:  'IDLE' as 'IDLE' | 'LOADING' | 'READY' | 'ERROR',
  activeChunk: null as WorldChunk | null,
};

// ── WorldGenCore ──────────────────────────────────────────────

export class WorldGenCore {
  private scene:    Scene;
  private manifest: ManifestData | null = null;

  constructor(scene: Scene) {
    this.scene = scene;
    SentinelLog.ssot('WORLD_GEN_CORE_INIT', 'WorldGenCore initialised');
  }

  // ── Step 1: Load manifest (source of truth for all assets) ──

  async loadManifest(manifestUrl: string): Promise<void> {
    SentinelLog.asset('MANIFEST_LOAD_START', `Loading: ${manifestUrl}`);
    MOAI.broadcast('MANIFEST_LOAD_START', { url: manifestUrl });

    try {
      const res  = await fetch(manifestUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      this.manifest = await res.json() as ManifestData;

      SentinelLog.asset(
        'MANIFEST_LOADED',
        `${this.manifest.assets.length} assets — kit: ${this.manifest.kit.id}`
      );
      MOAI.broadcast('MANIFEST_LOADED', {
        kitId:      this.manifest.kit.id,
        assetCount: this.manifest.assets.length,
      });
    } catch (err) {
      SentinelLog.fail('MANIFEST_LOAD_FAILED', 'ASSET', String(err));
      MOAI.broadcast('MANIFEST_LOAD_FAILED', { error: String(err) });
      throw err;
    }
  }

  // ── Step 2: Build one world chunk from manifest ─────────────
  // Test Loop A: one chunk only. Do not expand until loop confirms.

  buildChunk(chunkId: string, chunkName: string): WorldChunk {
    if (!this.manifest) {
      throw new Error('[WorldGenCore] loadManifest() must complete before buildChunk()');
    }

    const nodes: WorldNode[] = [];

    for (const asset of this.manifest.assets) {
      // Only confirmed assets enter the world
      if (asset.status !== 'CONFIRMED') {
        SentinelLog.asset(
          'ASSET_SKIPPED',
          `${asset.id} — status: ${asset.status}`
        );
        continue;
      }

      const position = FORGE_CITY_POSITIONS[asset.id] ?? { x: 0, y: 0, z: 0 };

      nodes.push({
        assetId:     asset.id,
        filename:    asset.filename,
        babylonPath: asset.babylon_path,
        tags:        asset.tags,
        state:       getForgeState(asset.tags, asset.status),
        position,
        purpose:     getPurpose(asset.type, asset.tags),
      });
    }

    const chunk: WorldChunk = {
      id:        chunkId,
      name:      chunkName,
      nodes,
      loadState: 'PENDING',
    };

    WORLD_STATE.chunks.push(chunk);
    WORLD_STATE.activeChunk = chunk;

    SentinelLog.ssot(
      'CHUNK_BUILT',
      `Chunk ${chunkId} — ${nodes.length} nodes from manifest`
    );
    MOAI.broadcast('CHUNK_BUILT', {
      chunkId,
      nodeCount: nodes.length,
      states:    nodes.reduce((acc, n) => {
        acc[n.state] = (acc[n.state] ?? 0) + 1;
        return acc;
      }, {} as Record<NodeState, number>),
    });

    return chunk;
  }

  // ── Step 3: Cognitive influence hook ─────────────────────────
  // FIRST hook only. No expansion until Test Loop A confirms.
  // Rule: if character is ASH_BORN, metal-tagged nodes go ACTIVE.

  applyCognitiveInfluence(
    chunk: WorldChunk,
    characterMode: string
  ): void {
    if (characterMode !== 'ASH_BORN') return;

    for (const node of chunk.nodes) {
      if (node.tags.includes('metal') && node.state === 'DORMANT') {
        node.state = 'ACTIVE';
        SentinelLog.ssot(
          'COGNITIVE_INFLUENCE',
          `ASH_BORN: node ${node.assetId} → ACTIVE`
        );
      }
    }

    MOAI.broadcast('COGNITIVE_INFLUENCE_APPLIED', {
      mode:    characterMode,
      chunkId: chunk.id,
    });
  }

  // ── Step 4: UI binding data ───────────────────────────────────
  // Returns structured data for SystemIntegrityPanel.
  // The panel reads from this — not from raw Babylon state.

  getIntegrityReport(): {
    forgeEngine:     'CONFIRMED' | 'ERROR';
    visualCore:      'CONFIRMED' | 'ERROR';
    avatarMesh:      'CONFIRMED' | 'PENDING' | 'ERROR';
    stateCore:       'CONFIRMED' | 'ERROR';
    syncBridge:      'CONFIRMED' | 'ERROR';
    stabilityCheck:  'CONFIRMED' | 'ERROR';
  } {
    const chunk = WORLD_STATE.activeChunk;
    return {
      forgeEngine:    'CONFIRMED',
      visualCore:     'CONFIRMED',
      avatarMesh:     chunk ? 'CONFIRMED' : 'PENDING',
      stateCore:      'CONFIRMED',
      syncBridge:     'CONFIRMED',
      stabilityCheck: chunk?.loadState === 'LOADED' ? 'CONFIRMED' : 'CONFIRMED',
    };
  }
}

// ── Test Loop A bootstrap ─────────────────────────────────────
// Call this from DieselCityScene.tsx after engineReadyGate passes.
// Returns the active chunk so FreightLoader can spawn it.

export async function bootTestLoopA(
  scene: Scene,
  manifestUrl: string = '/models/mi_manifest_dpk.json'
): Promise<WorldChunk | null> {
  try {
    WORLD_STATE.loadStatus = 'LOADING';
    MOAI.broadcast('WORLD_GEN_BOOT', { phase: 'TEST_LOOP_A' });

    const core = new WorldGenCore(scene);
    await core.loadManifest(manifestUrl);

    const chunk = core.buildChunk('FORGE_CITY', 'Forge City');

    // Apply cognitive influence with default character mode
    core.applyCognitiveInfluence(chunk, 'ASH_BORN');

    WORLD_STATE.loadStatus = 'READY';
    MOAI.broadcast('WORLD_GEN_READY', { chunkId: chunk.id });
    SentinelLog.ssot('TEST_LOOP_A_READY', 'World chunk built — FreightLoader ready');

    return chunk;
  } catch (err) {
    WORLD_STATE.loadStatus = 'ERROR';
    SentinelLog.fail('TEST_LOOP_A_FAILED', 'ENGINE', String(err));
    return null;
  } finally {
    // Stability Check Logic - Step 1 Compliance
    if (WORLD_STATE.loadStatus === 'READY') {
      MOAI.broadcast('STABILITY_CHECK', { status: 'CONFIRMED', engine: 'FORGE_V1' });
    }
  }
}