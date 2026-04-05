
'use client';
import * as BABYLON from 'babylonjs';
import 'babylonjs-loaders';

/**
 * @fileOverview FreightLoader.ts
 * Handles modular chunk loading for Forge City.
 * Phase 8.5 — manifest-driven GLB delivery via GitHub Releases CDN.
 * Compliance: SSOT Field Parity (id / babylon_path).
 */

interface ManifestAsset {
  id: string;
  babylon_path: string;
  status: string;
}

interface Manifest {
  kit: { id: string };
  assets: ManifestAsset[];
}

export class FreightLoader {
  private static MANIFEST_URL = '/models/mi_manifest_dpk.json';

  public static async loadChunk(scene: BABYLON.Scene): Promise<void> {
    console.log('[MOAI:FREIGHT] Loading City Chunk...');

    // Ground setup
    const ground = BABYLON.MeshBuilder.CreateGround(
      'city_ground',
      { width: 50, height: 50 },
      scene
    );
    const groundMaterial = new BABYLON.StandardMaterial('ground_mat', scene);
    groundMaterial.diffuseColor = new BABYLON.Color3(0.02, 0.02, 0.02);
    groundMaterial.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
    ground.material = groundMaterial;

    // Manifest fetch
    let manifest: Manifest;
    try {
      console.log('[MOAI:FREIGHT] Fetching manifest...');
      const res = await fetch(FreightLoader.MANIFEST_URL);
      if (!res.ok) throw new Error(`Manifest fetch failed: ${res.status}`);
      manifest = await res.json();
      console.log(`[MOAI:MANIFEST] Loaded kit: ${manifest.kit.id}`);
    } catch (err) {
      console.error('[MOAI:ERROR] Manifest sync failed:', err);
      return;
    }

    if (!manifest || !manifest.assets) {
      console.warn('[MOAI:FREIGHT] Manifest invalid or empty.');
      return;
    }

    // Load confirmed assets
    const confirmed = manifest.assets.filter(a => a.status === 'CONFIRMED');
    for (const asset of confirmed) {
      if (!asset.babylon_path) {
        console.warn(`[MOAI:FREIGHT] Asset ${asset.id} missing babylon_path.`);
        continue;
      }

      try {
        console.log(`[MOAI:LOAD] Spawning asset: ${asset.id}`);
        
        // Path splitting for Babylon SceneLoader compliance
        const path = asset.babylon_path;
        const lastSlash = path.lastIndexOf('/');
        const rootUrl = lastSlash !== -1 ? path.substring(0, lastSlash + 1) : '';
        const filename = lastSlash !== -1 ? path.substring(lastSlash + 1) : path;

        const result = await BABYLON.SceneLoader.ImportMeshAsync(
          '',
          rootUrl,
          filename,
          scene
        );
        
        if (result && result.meshes) {
          result.meshes.forEach(mesh => {
            mesh.metadata = { assetId: asset.id, state: 'ACTIVE' };
          });
          console.log(`[MOAI:SUCCESS] Asset active: ${asset.id}`);
        }
      } catch (err) {
        console.error(`[MOAI:ERROR] Failed to spawn ${asset.id}:`, err);
      }
    }
  }
}
