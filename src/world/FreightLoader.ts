'use client';
import * as BABYLON from 'babylonjs';
import 'babylonjs-loaders';

/**
 * FreightLoader.ts
 * Handles modular chunk loading for Forge City.
 * Phase 8.5 — manifest-driven GLB delivery via GitHub Releases CDN
 */

interface ManifestAsset {
  assetId: string;
  babylonPath: string;
  status: string;
}

interface Manifest {
  kit: { id: string };
  assets: ManifestAsset[];
}

export class FreightLoader {
  private static MANIFEST_URL = '/models/mi_manifest_dpk.json';

  public static async loadChunk(scene: BABYLON.Scene): Promise<void> {
    console.log('[FREIGHT] Loading City Chunk...');

    // Ground
    const ground = BABYLON.MeshBuilder.CreateGround(
      'city_ground',
      { width: 50, height: 50 },
      scene
    );
    const groundMaterial = new BABYLON.StandardMaterial('ground_mat', scene);
    groundMaterial.diffuseColor = new BABYLON.Color3(0.05, 0.05, 0.05);
    ground.material = groundMaterial;

    // Manifest fetch
    let manifest: Manifest;
    try {
      console.log('[FREIGHT] Fetching manifest...');
      const res = await fetch(FreightLoader.MANIFEST_URL);
      if (!res.ok) throw new Error(`Manifest fetch failed: ${res.status}`);
      manifest = await res.json();
      console.log(`[FREIGHT] Manifest loaded — kit: ${manifest.kit.id}`);
    } catch (err) {
      console.error('[FREIGHT] Manifest error:', err);
      return;
    }

    // Load confirmed assets
    const confirmed = manifest.assets.filter(a => a.status === 'CONFIRMED');
    for (const asset of confirmed) {
      try {
        console.log(`[FREIGHT] Loading asset: ${asset.assetId}`);
        const result = await BABYLON.SceneLoader.ImportMeshAsync(
          '',
          asset.babylonPath,
          '',
          scene
        );
        result.meshes.forEach(mesh => {
          mesh.metadata = { assetId: asset.assetId, state: 'ACTIVE' };
        });
        console.log(`[FREIGHT] ✅ Asset spawned: ${asset.assetId}`);
      } catch (err) {
        console.error(`[FREIGHT] ❌ Failed to load ${asset.assetId}:`, err);
      }
    }
  }
}
