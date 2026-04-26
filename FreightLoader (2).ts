// ============================================================
// FreightLoader.ts — Test Loop A (MTD PULSE)
// Phase 8.5 | Simpro Titans Studio, LLC
// ============================================================
// Loads GLBs from WorldChunk nodes into the Babylon scene.
// No hardcoded paths. All paths from manifest via WorldGenCore.
// Every load guarded by isMounted + scene.isDisposed.
// ============================================================

import { SceneLoader, Vector3, AbstractMesh } from '@babylonjs/core';
import type { Scene }                          from '@babylonjs/core';
import { MOAI }                                from '../lib/moai';
import { SentinelLog }                         from '../lib/SentinelLogger';
import type { WorldChunk, WorldNode }          from './WorldGenCore';

// ── Load result ───────────────────────────────────────────────

export interface LoadedNode {
  node:   WorldNode;
  meshes: AbstractMesh[];
}

// ── FreightLoader ─────────────────────────────────────────────

export class FreightLoader {
  private scene:     Scene;
  private isMounted: React.MutableRefObject<boolean>;
  private loaded:    LoadedNode[] = [];

  constructor(
    scene:     Scene,
    isMounted: React.MutableRefObject<boolean>
  ) {
    this.scene     = scene;
    this.isMounted = isMounted;
  }

  // ── Load all CONFIRMED nodes from a chunk ─────────────────

  async loadChunk(chunk: WorldChunk): Promise<LoadedNode[]> {
    SentinelLog.asset(
      'FREIGHT_LOAD_START',
      `Loading chunk: ${chunk.id} — ${chunk.nodes.length} nodes`
    );
    MOAI.broadcast('FREIGHT_LOAD_START', { chunkId: chunk.id });

    chunk.loadState = 'LOADING';
    this.loaded     = [];

    for (const node of chunk.nodes) {
      if (!this.isMounted.current || this.scene.isDisposed) {
        SentinelLog.engine('FREIGHT_LOAD_ABORTED', 'Scene disposed during chunk load');
        break;
      }

      const loadedNode = await this.loadNode(node);
      if (loadedNode) this.loaded.push(loadedNode);
    }

    chunk.loadState = 'LOADED';
    SentinelLog.asset(
      'FREIGHT_LOAD_COMPLETE',
      `Chunk ${chunk.id}: ${this.loaded.length} / ${chunk.nodes.length} loaded`
    );
    MOAI.broadcast('FREIGHT_LOAD_COMPLETE', {
      chunkId:  chunk.id,
      loaded:   this.loaded.length,
      total:    chunk.nodes.length,
    });

    return this.loaded;
  }

  // ── Load a single node ────────────────────────────────────

  private async loadNode(node: WorldNode): Promise<LoadedNode | null> {
    const url       = node.babylonPath;
    const lastSlash = url.lastIndexOf('/') + 1;
    const rootUrl   = url.slice(0, lastSlash);
    const filename  = url.slice(lastSlash);

    try {
      const result = await SceneLoader.ImportMeshAsync('', rootUrl, filename, this.scene);

      // Guard after every await — isMounted may have changed
      if (!this.isMounted.current || this.scene.isDisposed) {
        result.meshes.forEach(m => m.dispose());
        return null;
      }

      const root = result.meshes.find(m => m.name === '__root__') ?? result.meshes[0];
      if (!root) return null;

      // Position from chunk layout
      root.position = new Vector3(node.position.x, node.position.y, node.position.z);

      // Tag mesh with node state for SystemIntegrityPanel queries
      root.metadata = {
        assetId: node.assetId,
        state:   node.state,
        purpose: node.purpose,
        tags:    node.tags,
      };

      SentinelLog.asset(
        'NODE_LOADED',
        `${node.assetId} → ${node.state} at (${node.position.x}, ${node.position.y}, ${node.position.z})`
      );

      return { node, meshes: result.meshes };

    } catch (err) {
      SentinelLog.fail('NODE_LOAD_FAILED', 'ASSET', `${node.assetId}: ${String(err)}`);
      MOAI.broadcast('NODE_LOAD_FAILED', { assetId: node.assetId, error: String(err) });
      return null;
    }
  }

  // ── Dispose all loaded meshes ─────────────────────────────

  dispose(): void {
    for (const loadedNode of this.loaded) {
      loadedNode.meshes.forEach(m => {
        if (!m.isDisposed()) m.dispose();
      });
    }
    this.loaded = [];
    SentinelLog.engine('FREIGHT_LOADER_DISPOSED', 'All chunk meshes disposed');
  }

  getLoaded(): LoadedNode[] {
    return this.loaded;
  }
}
