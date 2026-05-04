'use client';
/**
 * CharacterController.ts
 * ENIGMATIC UNIVERSES — NexusVerse Runtime
 * 
 * Drop into: /src/babylon/CharacterController.ts
 * 
 * Loads scene-mint-deploy-[anim].glb assets from /public/models/
 * Implements combat-aware animation state machine
 * Exposes state hooks to UIOrchestrator and SmartWatch
 * 
 * Asset naming convention (locked):
 *   scene-mint-deploy-walk.glb    ✅ CONFIRMED LIVE
 *   scene-mint-deploy-idle.glb    ⏳ next export
 *   scene-mint-deploy-run.glb     ⏳ next export
 *   scene-mint-deploy-attack.glb  ⏳ queue
 */

import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders/glTF';
import { SSOT, updatePlayerPosition, updatePlayerVitals } from './SSOT';
import { SentinelLog } from './SentinelLogger';
import { MOAI } from './MOAI';

// ── TYPES ──────────────────────────────────────────────────────────
export type CharacterState =
  | 'idle'
  | 'walk'
  | 'run'
  | 'attack'
  | 'deploy'
  | 'death'
  | 'jump';

export interface CharacterStats {
  state:       CharacterState;
  position:    { x: number; y: number; z: number };
  health:      number;
  fuel:        number;
  isAttacking: boolean;
  isDeployed:  boolean;
  meshCount:   number;
  boneCount:   number;
  polyCount:   number;
  fps:         number;
  loadedAnim:  string;
}

export type StateChangeCallback = (stats: CharacterStats) => void;

// ── MODEL REGISTRY ────────────────────────────────────────────────
// Maps state → GLB filename. Falls back to walk if anim not yet exported.
const ANIM_REGISTRY: Partial<Record<CharacterState, string>> = {
  walk:   'scene-mint-deploy-walk.glb',
  idle:   'scene-mint-deploy-idle.glb',
  run:    'scene-mint-deploy-run.glb',
  attack: 'scene-mint-deploy-attack.glb',
  deploy: 'scene-mint-deploy-walk.glb',   // fallback until export
  death:  'scene-mint-deploy-idle.glb',   // fallback until export
  jump:   'scene-mint-deploy-walk.glb',   // fallback until export
};

const MODEL_BASE = 'https://raw.githubusercontent.com/studioprotitan/Forge-Avatars/main/models/';
const FALLBACK_MODEL = 'scene-mint-deploy-walk.glb';

// ── CHARACTER CONTROLLER CLASS ────────────────────────────────────
export class CharacterController {
  private scene:       BABYLON.Scene;
  private root:        BABYLON.AbstractMesh | null = null;
  private animMap:     Map<string, BABYLON.AnimationGroup> = new Map();
  private currentAnim: BABYLON.AnimationGroup | null = null;
  private state:       CharacterState = 'idle';
  private input:       Record<string, boolean> = {};

  private isAttacking: boolean = false;
  private isDeployed:  boolean = false;
  private attackCooldown: number = 0;
  
  private lastLogTime: number = 0;

  private onStateChange: StateChangeCallback | null = null;
  private loadedModels:  Map<string, BABYLON.AbstractMesh> = new Map();

  // Mesh stats
  private meshCount: number = 0;
  private boneCount: number = 0;
  private polyCount: number = 0;

  constructor(scene: BABYLON.Scene, callback?: StateChangeCallback) {
    this.scene = scene;
    this.onStateChange = callback ?? null;
    this._setupInput();
    this._setupLoop();
  }

  // ── PUBLIC API ────────────────────────────────────────────────

  /** Load the default walk model and start the character */
  async init(startState: CharacterState = 'walk'): Promise<void> {
    await this._loadModel(startState);
    this.setState(startState);
  }

  /** Teleport-style state switch — loads new GLB if needed */
  async setState(next: CharacterState): Promise<void> {
    if (this.state === next && this.root) return;
    const previous = this.state;
    this.state = next;
    await this._ensureModelLoaded(next);

    // Compliance: Telemetry for state transition
    SentinelLog.engine("CHAR_STATE_TRANSITION", `${previous} -> ${next}`);
    MOAI.broadcast("CHARACTER_STATE_CHANGE", { from: previous, to: next });
    this._emitStats();
  }

  /** Trigger attack (with cooldown) */
  triggerAttack(): void {
    if (this.isAttacking || this.attackCooldown > 0) return;
    this.isAttacking = true;
    this.attackCooldown = 600;
    void this.setState('attack');
    setTimeout(() => {
      this.isAttacking = false;
      void this.setState(this._isMoving() ? 'walk' : 'idle');
    }, 600);
  }

  /** Deploy card / ability activation */
  triggerDeploy(): void {
    this.isDeployed = true;
    void this.setState('deploy');
    setTimeout(() => {
      this.isDeployed = false;
      void this.setState('idle');
    }, 1200);
  }

  /** Take damage — updates health, triggers feedback */
  takeDamage(amount: number): void {
    const nextHP = Math.max(0, SSOT.player.health - amount);
    const nextFuel = Math.max(0, SSOT.player.fuel - Math.floor(amount * 0.5));
    updatePlayerVitals(nextHP, nextFuel);

    this._emitStats();
    if (nextHP <= 0) void this.setState('death');
  }

  /** Restore fuel (from card or extract zone) */
  restoreFuel(amount: number): void {
    updatePlayerVitals(undefined, Math.min(100, SSOT.player.fuel + amount));
    this._emitStats();
  }

  getStats(): CharacterStats {
    const p = this.root?.position ?? { x: 0, y: 0, z: 0 };
    return {
      state:       this.state,
      position:    { x: +p.x.toFixed(2), y: +p.y.toFixed(2), z: +p.z.toFixed(2) },
      health:      SSOT.player.health,
      fuel:        SSOT.player.fuel,
      isAttacking: this.isAttacking,
      isDeployed:  this.isDeployed,
      meshCount:   this.meshCount,
      boneCount:   this.boneCount,
      polyCount:   this.polyCount,
      fps:         Math.round(this.scene.getEngine().getFps()),
      loadedAnim:  this.currentAnim?.name ?? '—',
    };
  }

  dispose(): void {
    this._teardownInput();
    this.loadedModels.forEach(m => m.dispose());
    this.loadedModels.clear();
  }

  // ── PRIVATE: MODEL LOADING ────────────────────────────────────

  private async _loadModel(state: CharacterState): Promise<void> {
    const filename = ANIM_REGISTRY[state] ?? FALLBACK_MODEL;
    const cacheKey = filename;

    if (this.loadedModels.has(cacheKey)) {
      this._activateModel(cacheKey);
      return;
    }

    try {
      const result = await BABYLON.SceneLoader.ImportMeshAsync(
        '',
        MODEL_BASE,
        filename,
        this.scene
      );

      const mesh = result.meshes[0];
      if (!mesh) throw new Error('No mesh found in ' + filename);

      // Center and ground the character
      const bb = mesh.getHierarchyBoundingVectors(true);
      mesh.position.y = -bb.min.y;

      // Stats
      let mc = 0, pc = 0, bc = 0;
      result.meshes.filter((m: BABYLON.AbstractMesh) => m.name !== '__root__').forEach((m: BABYLON.AbstractMesh) => {
        if (m instanceof BABYLON.Mesh) {
          mc++;
          pc += (m.getTotalIndices() / 3);
        }
      });

      if (result.skeletons.length) bc = result.skeletons[0].bones.length;
      this.meshCount = mc;
      this.polyCount = Math.round(pc);
      this.boneCount = bc;

      // Register animation groups
      result.animationGroups.forEach((ag: BABYLON.AnimationGroup) => {
        this.animMap.set(ag.name.toLowerCase(), ag);
        ag.stop();
      });

      // Hide by default, cache
      mesh.setEnabled(false);
      this.loadedModels.set(cacheKey, mesh);
      this._activateModel(cacheKey);

    } catch (err) {
      // Fallback to walk if file doesn't exist yet
      if (filename !== FALLBACK_MODEL) {
        console.warn(`[CharacterController] ${filename} not found, falling back to ${FALLBACK_MODEL}`);
        await this._loadModel('walk');
      } else {
        console.error('[CharacterController] Fallback model also failed:', err);
      }
    }
  }

  private async _ensureModelLoaded(state: CharacterState): Promise<void> {
    const filename = ANIM_REGISTRY[state] ?? FALLBACK_MODEL;
    if (!this.loadedModels.has(filename)) {
      await this._loadModel(state);
    } else {
      this._activateModel(filename);
    }
    this._playStateAnim(state);
  }

  private _activateModel(cacheKey: string): void {
    // Deactivate all
    this.loadedModels.forEach((m, k) => {
      m.setEnabled(k === cacheKey);
    });
    this.root = this.loadedModels.get(cacheKey) ?? null;
  }

  // ── PRIVATE: ANIMATION ────────────────────────────────────────

  private _playAnim(name: string, loop = true): void {
    const ag = this.animMap.get(name.toLowerCase())
      ?? this.animMap.get('as_ue5_mf_' + name.toLowerCase())  // UE5 naming prefix fallback
      ?? this.animMap.values().next().value;                    // first available

    if (!ag || ag === this.currentAnim) return;
    this.currentAnim?.stop();
    ag.start(loop);
    this.currentAnim = ag;
  }

  private _playStateAnim(state: CharacterState): void {
    const animNames: Record<CharacterState, string[]> = {
      idle:   ['idle', 'as_idle', 'as_ue5_mf_idle'],
      walk:   ['walk', 'as_ue5_mf_walk_fwd', 'walk_fwd'],
      run:    ['run', 'as_ue5_mf_run_fwd', 'run_fwd'],
      attack: ['attack', 'attack_a'],
      deploy: ['deploy', 'walk'],
      death:  ['death', 'idle'],
      jump:   ['jump', 'walk'],
    };
    const names = animNames[state] ?? ['idle'];
    for (const n of names) {
      if (this.animMap.has(n)) { this._playAnim(n); return; }
    }
    // Play first available
    const first = this.animMap.values().next().value;
    if (first) { first.start(true); this.currentAnim = first; }
  }

  // ── PRIVATE: INPUT ────────────────────────────────────────────

  private _setupInput(): void {
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp   = this._onKeyUp.bind(this);
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup',   this._onKeyUp);
  }

  private _teardownInput(): void {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup',   this._onKeyUp);
  }

  private _onKeyDown(e: KeyboardEvent): void { this.input[e.key.toLowerCase()] = true; }
  private _onKeyUp(e: KeyboardEvent):   void { this.input[e.key.toLowerCase()] = false; }

  private _isMoving(): boolean {
    return !!(this.input['w'] || this.input['a'] || this.input['s'] || this.input['d']
           || this.input['arrowup'] || this.input['arrowdown']);
  }

  // ── PRIVATE: GAME LOOP ────────────────────────────────────────

  private _setupLoop(): void {
    this.scene.onBeforeRenderObservable.add(() => {
      if (!this.root) return;

      const speed = this.input['shift'] ? 0.12 : 0.06;
      let moved = false;

      if (this.input['w'] || this.input['arrowup'])    { this.root.position.z += speed; moved = true; }
      if (this.input['s'] || this.input['arrowdown'])  { this.root.position.z -= speed; moved = true; }
      if (this.input['a'] || this.input['arrowleft'])  { this.root.position.x -= speed; moved = true; }
      if (this.input['d'] || this.input['arrowright']) { this.root.position.x += speed; moved = true; }

      // SSOT Compliance: Mirror movement to global source of truth
      if (moved) {
        updatePlayerPosition(this.root.position.x, this.root.position.y, this.root.position.z);
      }

      if (!this.isAttacking && !this.isDeployed) {
        if (moved && this.input['shift']) {
          if (this.state !== 'run')  void this.setState('run');
        } else if (moved) {
          if (this.state !== 'walk') void this.setState('walk');
        } else {
          if (this.state !== 'idle') void this.setState('idle');
        }
      }

      if (this.input['f']) this.triggerAttack();
      if (this.input['e']) this.triggerDeploy();

      // Cooldown tick
      if (this.attackCooldown > 0) this.attackCooldown -= this.scene.getEngine().getDeltaTime();

      // Fuel drain when moving
      if (moved) {
        const nextFuel = Math.max(0, SSOT.player.fuel - 0.002);
        updatePlayerVitals(undefined, nextFuel);
        if (nextFuel <= 0 && this.state !== 'idle') void this.setState('idle');
      }
    });
  }

  private _emitStats(): void {
    this.onStateChange?.(this.getStats());
  }
}

// ── SCENE CONTROLLER ──────────────────────────────────────────────
// Minimal scene setup — drop into SceneManager.ts or use standalone

export function buildCSTScene(
  engine: BABYLON.Engine,
  canvas: HTMLCanvasElement,
  onStats?: StateChangeCallback
): { scene: BABYLON.Scene; controller: CharacterController } {

  const scene = new BABYLON.Scene(engine);
  scene.clearColor = new BABYLON.Color4(0.027, 0.027, 0.043, 1);
  scene.ambientColor = new BABYLON.Color3(1, 1, 1);

  // ── Follow camera ──
  const camera = new BABYLON.FollowCamera('cam', new BABYLON.Vector3(0, 3, -8), scene);
  camera.radius        = 8;
  camera.heightOffset  = 3;
  camera.rotationOffset = 180;
  camera.cameraAcceleration = 0.05;
  camera.maxCameraSpeed = 10;
  camera.attachControl(canvas, true);

  // ── CST Lighting (Combat / Aquila) ──
  const key = new BABYLON.DirectionalLight('key', new BABYLON.Vector3(1.4, 0.4, 3), scene);
  key.diffuse    = new BABYLON.Color3(1, 0.9, 0.8);
  key.intensity  = 1;

  const fill = new BABYLON.DirectionalLight('fill', new BABYLON.Vector3(0.35, 0.55, 0.25), scene);
  fill.diffuse   = new BABYLON.Color3(0.5, 0.6, 1);
  fill.intensity = 0.45;

  const rim = new BABYLON.DirectionalLight('rim', new BABYLON.Vector3(0.8, 0, -0.6), scene);
  rim.diffuse    = new BABYLON.Color3(1, 0.3, 0.2);
  rim.intensity  = 0.35;

  // ── Ground grid ──
  const ground = BABYLON.MeshBuilder.CreateGround('grd', { width: 20, height: 20, subdivisions: 30 }, scene);
  const gm = new BABYLON.StandardMaterial('gm', scene);
  gm.wireframe = true;
  gm.emissiveColor = new BABYLON.Color3(0.05, 0.05, 0.08);
  ground.material = gm;

  // ── Atmosphere particles ──
  const ps = new BABYLON.ParticleSystem('atm', 60, scene);
  ps.emitter    = new BABYLON.Vector3(0, 2, 0);
  ps.minEmitBox = new BABYLON.Vector3(-8, 0, -8);
  ps.maxEmitBox = new BABYLON.Vector3(8, 4, 8);
  ps.color1     = new BABYLON.Color4(0.94, 0.62, 0.15, 0.1);
  ps.color2     = new BABYLON.Color4(0.5, 0.46, 0.87, 0.07);
  ps.colorDead  = new BABYLON.Color4(0, 0, 0, 0);
  ps.minSize    = 0.02; ps.maxSize    = 0.05;
  ps.minLifeTime = 6;   ps.maxLifeTime = 12;
  ps.emitRate   = 6;
  ps.minEmitPower = 0.04; ps.maxEmitPower = 0.08;
  ps.updateSpeed = 0.01;
  ps.start();

  // ── Character controller ──
  const controller = new CharacterController(scene, onStats);

  // Wire follow camera once root is ready
  const observer = scene.onBeforeRenderObservable.add(() => {
    if (controller.getStats().meshCount > 0) {
      // Root is loaded — nothing needed, FollowCamera auto-tracks via lockedTarget
      scene.onBeforeRenderObservable.remove(observer);
    }
  });

  return { scene, controller };
}

// ── SMARTWATCH BRIDGE ─────────────────────────────────────────────
// Call this from UIOrchestrator.tsx or SmartWatch.tsx
// Maps CharacterStats → SmartWatch display data

export interface SmartWatchPayload {
  health:     number;   // 0–100
  fuel:       number;   // 0–100
  state:      string;   // current animation state
  position:   string;   // formatted XYZ
  riftLevel:  number;   // 0–100 (derived from fuel drain + combat)
  isInCombat: boolean;
}

export function toSmartWatchPayload(stats: CharacterStats): SmartWatchPayload {
  return {
    health:     stats.health,
    fuel:       stats.fuel,
    state:      stats.state.toUpperCase(),
    position:   `${stats.position.x} / ${stats.position.y} / ${stats.position.z}`,
    riftLevel:  Math.round((100 - stats.fuel) * 0.4 + (stats.isAttacking ? 20 : 0)),
    isInCombat: stats.isAttacking || stats.state === 'attack',
  };
}
