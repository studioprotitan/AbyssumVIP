/**
 * DieselCityScene.tsx
 * Phase 8.5 Orchestrator — Step 3 Compliance Applied
 */

'use client';

import React, { useEffect, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders/glTF'; // Step 3: Required for ImportMeshAsync
import { FreightLoader } from '@/world/FreightLoader';
import { WORLD_STATE, bootTestLoopA } from '@/world/WorldGenCore'; // Import bootTestLoopA

export default function DieselCityScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new BABYLON.Engine(canvasRef.current, true);
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0.02, 0.02, 0.03, 1);

    // Camera & Light
    const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 10, BABYLON.Vector3.Zero(), scene);
    camera.attachControl(canvasRef.current, true);
    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 0.7;

    // Step 6: Boot Test Loop A
    const runTestLoopA = async () => {
      console.log("[BOOT] Test Loop A Initiated (via WorldGenCore)");

      try {
        // Call the bootTestLoopA from WorldGenCore
        const chunk = await bootTestLoopA(scene);

        if (chunk) {
          console.log("[BOOT] WorldGenCore Test Loop A completed successfully.");

          // Load the confirmed clock asset from the built chunk
          const clockNode = chunk.nodes.find(node => node.assetId === 'dpk-prop-clock-a');
          if (clockNode) {
            await FreightLoader.loadAsset(scene, clockNode.filename);
            console.log("[BOOT] GLB Spawned: Clock A (from FreightLoader)");
          } else {
            console.warn("[BOOT] Clock asset 'dpk-prop-clock-a' not found in built chunk.");
          }

          if (WORLD_STATE.loadStatus === 'READY') {
            console.log("[BOOT] WORLD_STATE stability verified (via WorldGenCore.loadStatus)");
          }
        } else {
          console.error("[BOOT] WorldGenCore Test Loop A failed to build chunk.");
        }

      } catch (err) {
        console.error("[BOOT] Test Loop A Failed:", err);
      }
    };

    runTestLoopA();

    engine.runRenderLoop(() => {
      scene.render();
    });

    window.addEventListener('resize', () => engine.resize());

    return () => {
      engine.dispose();
    };
  }, []);

  return (
    <canvas ref={canvasRef} className="w-full h-full block touch-none outline-none" id="renderCanvas" />
  );
}