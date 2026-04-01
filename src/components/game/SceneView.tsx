
'use client';

import React, { useEffect, useRef } from 'react';
import * as BABYLON from 'babylonjs';
import 'babylonjs-loaders';
import { PhaseState, OperatorStats, SurvivalDirective } from '@/lib/game/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';

interface SceneViewProps {
  phase: PhaseState;
  stats?: OperatorStats;
}

export const SceneView: React.FC<SceneViewProps> = ({ phase, stats }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<BABYLON.Engine | null>(null);
  const sceneRef = useRef<BABYLON.Scene | null>(null);
  const particleSystemRef = useRef<BABYLON.ParticleSystem | null>(null);
  const cameraRef = useRef<BABYLON.ArcRotateCamera | null>(null);
  const characterRef = useRef<BABYLON.Mesh | null>(null);
  const characterMatRef = useRef<BABYLON.StandardMaterial | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new BABYLON.Engine(canvasRef.current, true);
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0.05, 0.04, 0.03, 1);

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

    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 0.7;

    const pointLight = new BABYLON.PointLight("pointLight", new BABYLON.Vector3(0, 5, 0), scene);
    pointLight.diffuse = new BABYLON.Color3(1, 0.5, 0.2);
    pointLight.intensity = 1.2;

    // Ember Particle System
    const emberTexture = PlaceHolderImages.find(img => img.id === 'ember-texture')?.imageUrl || '';
    const particleSystem = new BABYLON.ParticleSystem("embers", 2000, scene);
    particleSystem.particleTexture = new BABYLON.Texture(emberTexture, scene);
    particleSystem.emitter = new BABYLON.Vector3(0, -2, 0);
    particleSystem.minEmitBox = new BABYLON.Vector3(-10, 0, -10);
    particleSystem.maxEmitBox = new BABYLON.Vector3(10, 0, 10);
    particleSystem.color1 = new BABYLON.Color4(1, 0.5, 0.2, 1);
    particleSystem.color2 = new BABYLON.Color4(0.8, 0.2, 0.1, 1);
    particleSystem.minSize = 0.05;
    particleSystem.maxSize = 0.2;
    particleSystem.minLifeTime = 1;
    particleSystem.maxLifeTime = 4;
    particleSystem.emitRate = 100;
    particleSystem.gravity = new BABYLON.Vector3(0, 0.5, 0);
    particleSystem.direction1 = new BABYLON.Vector3(-1, 2, -1);
    particleSystem.direction2 = new BABYLON.Vector3(1, 5, 1);
    particleSystem.start();

    // Floor
    const groundTexture = PlaceHolderImages.find(img => img.id === 'arena-ground')?.imageUrl || '';
    const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 50, height: 50 }, scene);
    const groundMat = new BABYLON.StandardMaterial("groundMat", scene);
    groundMat.diffuseTexture = new BABYLON.Texture(groundTexture, scene);
    groundMat.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
    ground.material = groundMat;

    // Placeholder Character Mesh
    const character = BABYLON.MeshBuilder.CreateBox("character", { size: 1 }, scene);
    character.position.y = 1;
    const charMat = new BABYLON.StandardMaterial("charMat", scene);
    charMat.emissiveColor = new BABYLON.Color3(1, 0.5, 0.2);
    character.material = charMat;
    characterRef.current = character;
    characterMatRef.current = charMat;

    engine.runRenderLoop(() => {
      scene.render();
      character.rotation.y += 0.01;
      
      // Simulated floating/bobbing
      character.position.y = 1 + Math.sin(Date.now() * 0.002) * 0.1;
    });

    const handleResize = () => engine.resize();
    window.addEventListener('resize', handleResize);

    engineRef.current = engine;
    sceneRef.current = scene;
    particleSystemRef.current = particleSystem;
    cameraRef.current = camera;

    return () => {
      window.removeEventListener('resize', handleResize);
      engine.dispose();
    };
  }, []);

  // Sync visuals with phase and survival directives
  useEffect(() => {
    if (!particleSystemRef.current || !cameraRef.current || !characterMatRef.current) return;

    switch (phase) {
      case PhaseState.LOADING:
        particleSystemRef.current.emitRate = 50;
        cameraRef.current.radius = 25;
        break;
      case PhaseState.LANDING:
        particleSystemRef.current.emitRate = 200;
        cameraRef.current.radius = 15;
        break;
      case PhaseState.STREAMING:
        particleSystemRef.current.emitRate = 600;
        cameraRef.current.radius = 10;
        break;
    }

    if (stats?.activeDirective === SurvivalDirective.EMERGENCY) {
      characterMatRef.current.emissiveColor = new BABYLON.Color3(1, 0, 0); // Red for emergency
      particleSystemRef.current.color1 = new BABYLON.Color4(1, 0, 0, 1);
    } else if (stats?.activeDirective === SurvivalDirective.FIGHT) {
      characterMatRef.current.emissiveColor = new BABYLON.Color3(1, 0.5, 0); // Orange for fight
      particleSystemRef.current.color1 = new BABYLON.Color4(1, 0.5, 0, 1);
    } else {
      characterMatRef.current.emissiveColor = new BABYLON.Color3(1, 0.5, 0.2); // Normal ember
      particleSystemRef.current.color1 = new BABYLON.Color4(1, 0.5, 0.2, 1);
    }
  }, [phase, stats?.activeDirective]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-void-dark">
      <canvas ref={canvasRef} className="w-full h-full touch-none" />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-void-dark/80 via-transparent to-void-dark/20" />
    </div>
  );
};
