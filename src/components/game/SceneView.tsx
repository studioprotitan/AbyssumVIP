'use client';

import React, { useEffect, useRef } from 'react';
import * as BABYLON from 'babylonjs';
import 'babylonjs-loaders';
import { PhaseState, OperatorStats, SurvivalDirective } from '@/lib/game/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';

interface SceneViewProps {
  phase: PhaseState;
  stats?: OperatorStats;
  isWarmed?: boolean;
}

export const SceneView: React.FC<SceneViewProps> = ({ phase, stats, isWarmed }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<BABYLON.Engine | null>(null);
  const sceneRef = useRef<BABYLON.Scene | null>(null);
  const characterRef = useRef<BABYLON.Mesh | null>(null);
  const characterMatRef = useRef<BABYLON.StandardMaterial | null>(null);
  const characterWireMatRef = useRef<BABYLON.StandardMaterial | null>(null);
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
      15,
      BABYLON.Vector3.Zero(),
      scene
    );
    camera.attachControl(canvasRef.current, true);
    camera.lowerRadiusLimit = 5;
    camera.upperRadiusLimit = 30;

    const ambientLight = new BABYLON.HemisphericLight("ambient", new BABYLON.Vector3(0, 1, 0), scene);
    ambientLight.intensity = 0.3;

    const emberLight = new BABYLON.PointLight("emberLight", new BABYLON.Vector3(0, 5, 0), scene);
    emberLight.diffuse = new BABYLON.Color3(1, 0.4, 0.1);
    emberLight.intensity = 0;

    // Materials
    const wireMat = new BABYLON.StandardMaterial("wireMat", scene);
    wireMat.wireframe = true;
    wireMat.emissiveColor = new BABYLON.Color3(0.2, 0.2, 0.2);
    characterWireMatRef.current = wireMat;

    const solidMat = new BABYLON.StandardMaterial("solidMat", scene);
    solidMat.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);
    solidMat.emissiveColor = new BABYLON.Color3(1, 0.4, 0.1);
    characterMatRef.current = solidMat;

    // Character Mesh
    const character = BABYLON.MeshBuilder.CreateBox("character", { size: 2 }, scene);
    character.position.y = 1;
    character.material = wireMat;
    characterRef.current = character;

    // Particles
    const emberTexture = PlaceHolderImages.find(img => img.id === 'ember-texture')?.imageUrl || '';
    const particleSystem = new BABYLON.ParticleSystem("embers", 2000, scene);
    particleSystem.particleTexture = new BABYLON.Texture(emberTexture, scene);
    particleSystem.emitter = character;
    particleSystem.minSize = 0.05;
    particleSystem.maxSize = 0.2;
    particleSystem.emitRate = 0;
    particleSystem.start();
    particleSystemRef.current = particleSystem;

    engine.runRenderLoop(() => {
      scene.render();
      if (character) {
        character.rotation.y += 0.005;
        character.rotation.x += 0.002;
        character.position.y = 1 + Math.sin(Date.now() * 0.001) * 0.2;
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
  }, []);

  // Sync visuals with warming state
  useEffect(() => {
    if (!characterRef.current || !characterMatRef.current || !characterWireMatRef.current || !particleSystemRef.current) return;

    if (isWarmed || phase === PhaseState.STREAMING) {
      characterRef.current.material = characterMatRef.current;
      particleSystemRef.current.emitRate = phase === PhaseState.STREAMING ? 600 : 200;
    } else {
      characterRef.current.material = characterWireMatRef.current;
      particleSystemRef.current.emitRate = 0;
    }
  }, [isWarmed, phase]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full touch-none" />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-void-dark/80 via-transparent to-void-dark/20" />
    </div>
  );
};
