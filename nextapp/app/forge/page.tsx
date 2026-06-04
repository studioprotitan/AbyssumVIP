'use client';

import { useEffect, useRef, useCallback } from 'react';

const SCENE_URL = process.env.NEXT_PUBLIC_HYPE_STAGE_SCENE_URL ||
  '/api/asset/scene-osu-mint-deploy-cam-01-a.babylon';

export default function ForgePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const initScene = useCallback(() => {
    const canvas = canvasRef.current;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!canvas || !(window as any).BABYLON) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const BABYLON = (window as any).BABYLON;
    const engine = new BABYLON.Engine(canvas, true);

    BABYLON.SceneLoader.LoadAsync('', SCENE_URL, engine)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((scene: any) => {
        scene.clearColor = new BABYLON.Color4(0.05, 0.05, 0.08, 1.0);
        scene.environmentTexture = null;

        let cam = scene.activeCamera;
        if (!cam) {
          cam = new BABYLON.ArcRotateCamera(
            'cam', -Math.PI / 2, Math.PI / 2.5, 2.68,
            new BABYLON.Vector3(0, 1, 0), scene
          );
        }
        cam.attachControl(canvas, true);

       // BABYLON.SceneLoader.ImportMeshAsync('', '/api/asset/cst-ert-stellar-woman.glb', '', scene)
//   .then((result: any) => {
//     if (result.meshes[0]) result.meshes[0].position = BABYLON.Vector3.Zero();
//     const idle = scene.animationGroups?.find((ag: any) => ag.name === 'cst-ert-idle-b');
//     scene.animationGroups?.forEach((ag: any) => ag.stop());
//     if (idle) idle.play(true);
//     else scene.animationGroups?.[0]?.play(true);
//   })
//   .catch((e: any) => console.warn('[MOAI:FORGE] Unit load warn:', e.message));

        engine.runRenderLoop(() => scene.render());
        window.addEventListener('resize', () => engine.resize());
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .catch((e: any) => console.error('[MOAI:FORGE] Scene load error:', e));
  }, []);

  useEffect(() => {
    const s1 = document.createElement('script');
    s1.src = 'https://cdn.babylonjs.com/babylon.js';
    s1.async = true;
    s1.onload = () => {
      const s2 = document.createElement('script');
      s2.src = 'https://cdn.babylonjs.com/loaders/babylonjs.loaders.min.js';
      s2.async = true;
      s2.onload = () => initScene();
      document.head.appendChild(s2);
    };
    document.head.appendChild(s1);
  }, [initScene]);

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#0d0d12' }}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }}
      />
    </div>
  );
}