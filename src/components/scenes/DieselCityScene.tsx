'use client';

import React, { useEffect, useRef } from 'react';
import * as BABYLON from 'babylonjs';
import 'babylonjs-loaders';
import { FreightLoader } from '@/world/FreightLoader';

/**
 * DieselCityScene.tsx
 * Orchestrates the Phase 8.5 Pilot World layer.
 * Implements Test Loop A with manifest synchronization.
 */
export default function DieselCityScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new BABYLON.Engine(canvasRef.current, true);
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0.01, 0.01, 0.01, 1);

    const camera = new BABYLON.ArcRotateCamera(
      "pilot_camera",
      -Math.PI / 2,
      Math.PI / 2.5,
      12,
      new BABYLON.Vector3(0, 1, 0),
      scene
    );
    camera.attachControl(canvasRef.current, true);

    const light = new BABYLON.HemisphericLight("grid_light", new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 0.6;

    const bootTestLoopA = async () => {
      try {
        console.log('[MOAI:BOOT] Loop A Initiated');
        
        // Fetch Manifest from public models
        const response = await fetch('/models/mi_manifest_dpk.json');
        if (!response.ok) throw new Error('Manifest 404');
        const manifest = await response.json();
        console.log('[MOAI:MANIFEST] Validated Kit:', manifest.kit.id);

        // Load authoritative clock GLB
        const clockAsset = manifest.assets.find((a: any) => a.id === 'dpk-prop-clock-a');
        if (clockAsset) {
          BABYLON.SceneLoader.ImportMeshAsync(
            "",
            "https://media.githubusercontent.com/media/studioprotitan/Forge-Avatars/main/models/",
            clockAsset.filename,
            scene
          ).then((result) => {
            const clock = result.meshes[0];
            clock.position = new BABYLON.Vector3(2, 0, 0);
            console.log('[MOAI:LOAD] Asset Spawned:', clockAsset.id);
          }).catch(e => console.warn('[MOAI:GLB] Clock load failed:', e));
        }

        // Initialize FreightLoader
        FreightLoader.loadChunk(scene);
      } catch (e) {
        console.error('[MOAI:ERROR] Loop A Failure:', e);
      }
    };

    bootTestLoopA();

    engine.runRenderLoop(() => {
      scene.render();
    });

    const handleResize = () => engine.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      engine.dispose();
    };
  }, []);

  return (
    <div className="w-full h-full relative">
      <canvas ref={canvasRef} className="w-full h-full outline-none" />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-void/60 via-transparent to-void/80" />
    </div>
  );
}
