'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const router = useRouter();

  const initParticles = useCallback(() => {
    const canvas = canvasRef.current;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!canvas || !(window as any).BABYLON) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const BABYLON = (window as any).BABYLON;

    const engine = new BABYLON.Engine(canvas, true, { alpha: true });
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0, 0, 0, 0);

    new BABYLON.ArcRotateCamera('cam', -Math.PI / 2, Math.PI / 2, 10, BABYLON.Vector3.Zero(), scene);
    const light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 0.1;

    const emitter = BABYLON.MeshBuilder.CreateSphere('emitter', { diameter: 0.01 }, scene);
    emitter.isVisible = false;
    emitter.position = new BABYLON.Vector3(0, -2, 0);

    const ps = new BABYLON.GPUParticleSystem('forgeParticles', { capacity: 3000 }, scene);
    ps.particleTexture = new BABYLON.Texture('https://assets.babylonjs.com/textures/flare.png', scene);
    ps.emitter = emitter;
    ps.minEmitBox = new BABYLON.Vector3(-4, 0, -0.1);
    ps.maxEmitBox = new BABYLON.Vector3(4, 0, 0.1);
    ps.color1 = new BABYLON.Color4(0.2, 0.5, 1.0, 1.0);
    ps.color2 = new BABYLON.Color4(0.0, 0.8, 1.0, 0.8);
    ps.colorDead = new BABYLON.Color4(0.0, 0.3, 0.8, 0.0);
    ps.minSize = 0.05;
    ps.maxSize = 0.25;
    ps.minLifeTime = 1.5;
    ps.maxLifeTime = 3.5;
    ps.emitRate = 400;
    ps.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
    ps.gravity = new BABYLON.Vector3(0, -0.3, 0);
    ps.direction1 = new BABYLON.Vector3(-0.5, 1, 0);
    ps.direction2 = new BABYLON.Vector3(0.5, 2, 0);
    ps.minEmitPower = 0.5;
    ps.maxEmitPower = 1.5;
    ps.updateSpeed = 0.01;
    ps.isBillboardBased = true;
    ps.start();

    engine.runRenderLoop(() => scene.render());
    window.addEventListener('resize', () => engine.resize());
  }, []);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdn.babylonjs.com/babylon.js';
    script.async = true;
    script.onload = () => initParticles();
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, [initParticles]);

  return (
    <main style={{
      width: '100vw',
      height: '100vh',
      backgroundImage: "url('/gateway-page-load-aspect-ratio-a.png')",
      backgroundSize: 'cover',
      backgroundPosition: 'center top',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-end',
      paddingBottom: '8vh',
      margin: 0,
      overflow: 'hidden',
      position: 'relative',
    }}>
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          mixBlendMode: 'screen',
        }}
      />
      <button
        onClick={() => router.push('/grid-entry')}
        style={{
          position: 'relative',
          zIndex: 10,
          color: '#20d9b4',
          fontFamily: 'monospace',
          fontSize: '16px',
          letterSpacing: '4px',
          border: '1px solid #20d9b4',
          padding: '12px 40px',
          background: 'rgba(0,0,0,0.7)',
          textTransform: 'uppercase',
          cursor: 'pointer',
        }}
      >
        ENTER THE FORGE
      </button>
    </main>
  );
}