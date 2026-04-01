
'use client';

import React, { useEffect, useRef } from 'react';
import * as BABYLON from 'babylonjs';
import 'babylonjs-loaders';
import { PhaseState, OperatorStats } from '@/lib/game/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';

interface SceneViewProps {
  phase: PhaseState;
  stats?: OperatorStats;
  isWarmed?: boolean;
}

export const SceneView: React.FC<SceneViewProps> = ({ phase, stats, lastAction = 'IDLE' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<BABYLON.Engine | null>(null);
  const sceneRef = useRef<BABYLON.Scene | null>(null);
  const playerRef = useRef<BABYLON.AbstractMesh | null>(null);
  const particleSystemRef = useRef<BABYLON.ParticleSystem | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new BABYLON.Engine(canvasRef.current, true);
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0.02, 0.02, 0.02, 1);

    const camera = new BABYLON.ArcRotateCamera(
      "camera",
      -Math.PI / 2,
      Math.PI / 2.5,
      10,
      BABYLON.Vector3.Zero(),
      scene
    );
    camera.attachControl(canvasRef.current, true);
    camera.lowerRadiusLimit = 4;
    camera.upperRadiusLimit = 20;

    const ambientLight = new BABYLON.HemisphericLight("ambient", new BABYLON.Vector3(0, 1, 0), scene);
    ambientLight.intensity = 0.5;

    // MANDATORY: Bridge Material logic for GLB PBR materials
    const _bridgeMaterials = (meshes: BABYLON.AbstractMesh[]) => {
      meshes.forEach(mesh => {
        if (mesh.material && mesh.material.getClassName() === "PBRMaterial") {
          const std = new BABYLON.StandardMaterial(mesh.material.name + "_std", scene);
          const pbr = mesh.material as any;
          std.diffuseColor = pbr.albedoColor ?? new BABYLON.Color3(1, 1, 1);
          std.emissiveColor = pbr.emissiveColor ?? new BABYLON.Color3(0.1, 0.05, 0.01);
          mesh.material.dispose();
          mesh.material = std;
        }
      });
    };

    // Load Stellar Woman GLB
    BABYLON.SceneLoader.ImportMesh(
      "",
      "https://raw.githubusercontent.com/studioprotitan/Forge-Avatars/main/models/",
      "scene-mint-deploy-idle.glb",
      scene,
      (meshes) => {
        const root = meshes[0];
        root.name = "player";
        root.position = new BABYLON.Vector3(0, 0, 0);
        playerRef.current = root;
        _bridgeMaterials(meshes);

        // Add Embers to Player
        const emberTexture = PlaceHolderImages.find(img => img.id === 'ember-texture')?.imageUrl || '';
        const particleSystem = new BABYLON.ParticleSystem("embers", 2000, scene);
        particleSystem.particleTexture = new BABYLON.Texture(emberTexture, scene);
        particleSystem.emitter = root;
        particleSystem.minSize = 0.05;
        particleSystem.maxSize = 0.2;
        particleSystem.emitRate = phase === PhaseState.STREAMING ? 600 : 0;
        particleSystem.start();
        particleSystemRef.current = particleSystem;
      }
    );

    engine.runRenderLoop(() => {
      scene.render();
      if (playerRef.current) {
        playerRef.current.position.y = Math.sin(Date.now() * 0.001) * 0.1;
      }
    });

    const handleResize = () => engine.resize();
    window.addEventListener('resize', handleResize);

    engineRef.current = engine;
    sceneRef.current = scene;

    return () => {
      window.removeEventListener('resize', handleResize);
      engine.dispose();
    };
  }, [phase]);

  // Sync visuals with phase
  useEffect(() => {
    if (particleSystemRef.current) {
      particleSystemRef.current.emitRate = phase === PhaseState.STREAMING ? 600 : 0;
    }
  }, [phase]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full touch-none" />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-void-dark/80 via-transparent to-void-dark/20" />
    </div>
  );
};
