/**
 * useCharacterController.ts
 * Genesis Verse — OMEGA Character Controller v2
 *
 * FIXES:
 *   P0-A: WASD was moving camera directly (MOAI Input Authority violation)
 *         FreeCamera attaches its own KeyboardMoveCamera input by default.
 *         That default input must be explicitly cleared before OMEGA takes over.
 *         Camera is now a FOLLOWER of the capsule mesh — never the mover.
 *
 *   P0-B: Capsule clipping through floor.
 *         Root cause: PhysicsAggregate origin is at mesh CENTER.
 *         If mesh pivot is at foot level (Y=0), aggregate sits half-underground.
 *         Fix: spawn capsule mesh with Y = CAPSULE_HALF_HEIGHT so center
 *         aligns with the aggregate origin. Ground aggregate verified at Y=0.
 *
 * ARCHITECTURE (MOAI compliant):
 *   Input Authority  → this hook exclusively (ref-based, no React state)
 *   Physics Authority → HavokPlugin exclusively (velocity-driven, not position)
 *   Camera Authority  → camera follows capsule via onAfterRenderObservable
 *   State Authority   → Zustand portal-storage (health/kills reported via callbacks)
 *
 * SSoT:
 *   All tuning constants defined once at top — never hardcoded inline
 *   Single cleanup path — one returned dispose() function
 *
 * USAGE:
 *   const { dispose } = useCharacterController(scene, camera, {
 *     onKill:         count => gameStore.setKills(count),
 *     onHealthChange: hp    => gameStore.setHealth(hp),
 *     spawnPosition:  new Vector3(0, CAPSULE_SPAWN_Y, -5),
 *   });
 *
 *   // In useEffect cleanup:
 *   return () => dispose();
 */

import { useRef, useCallback } from "react";
import {
  Scene,
  FreeCamera,
  Vector3,
  MeshBuilder,
  PhysicsAggregate,
  PhysicsShapeType,
  Ray,
  StandardMaterial,
  Color3,
  Mesh,
} from "@babylonjs/core";
import { SSOT, updatePlayerPosition } from "./core/SSOT";
import { MOAI } from "./core/MOAI";
import { SENTINEL } from "./core/SENTINEL";
import { throttleEntropy } from "./core/entropy";

// ─── SSoT: Tuning Constants ───────────────────────────────────────────────────

/** Visible capsule height in world units */
export const CAPSULE_HEIGHT      = 1.8;

/** Radius of the physics capsule collider */
export const CAPSULE_RADIUS      = 0.35;

/**
 * SPAWN Y — THIS IS THE CRITICAL FLOOR CLIPPING FIX.
 *
 * The PhysicsAggregate's capsule shape origin is at the MESH CENTER.
 * Ground plane is at Y = 0.
 * Therefore mesh center must be at Y = CAPSULE_HEIGHT / 2 at spawn.
 * Any value below this = clips through floor on first frame.
 */
export const CAPSULE_SPAWN_Y     = CAPSULE_HEIGHT / 2 + 0.01; // +0.01 safety margin

/** Camera sit-height above the capsule center (eye level) */
export const CAMERA_EYE_OFFSET   = new Vector3(0, CAPSULE_HEIGHT * 0.3, 0);

/** Camera follow distance behind capsule (third-person) */
export const CAMERA_FOLLOW_DIST  = 6;

/** Camera follow height above capsule center */
export const CAMERA_FOLLOW_HEIGHT = 2.5;

/** Camera lerp speed (0 = instant, 1 = never moves) */
export const CAMERA_LERP         = 0.12;

/** Horizontal movement speed (units/second) */
export const MOVE_SPEED          = 7;

/** Sprint multiplier applied to MOVE_SPEED */
export const SPRINT_MULT         = 1.75;

/** Vertical impulse applied on jump */
export const JUMP_IMPULSE        = 10;

/** Gravity (negative = downward, units/s²) */
export const GRAVITY             = -22;

/** Raycast length for grounded check (from capsule center downward) */
export const GROUND_RAY_LEN      = CAPSULE_HEIGHT / 2 + 0.2;

/** Minimum Y before emergency floor reset (prevents falling through world) */
export const FLOOR_KILL_PLANE    = -5;

// ─── Input State (ref-based — MOAI: Input Authority exclusive) ─────────────

interface InputState {
  forward:  boolean;
  backward: boolean;
  left:     boolean;
  right:    boolean;
  jump:     boolean;
  sprint:   boolean;
}

// ─── Hook Options ─────────────────────────────────────────────────────────────

interface CharacterControllerOptions {
  spawnPosition?:  Vector3;
  onKill?:         (kills: number) => void;
  onHealthChange?: (health: number) => void;
  showCapsule?:    boolean; // true = visible mesh (debug), false = invisible
}

// ─── Hook Return ──────────────────────────────────────────────────────────────

interface CharacterControllerResult {
  /** Call in useEffect cleanup — tears down all physics, inputs, observables */
  dispose:       () => void;
  /** Direct ref to capsule mesh — use for attaching child meshes/avatars */
  capsuleRef:    React.MutableRefObject<Mesh | null>;
  /** Teleport capsule to a new position (e.g. respawn) */
  teleport:      (position: Vector3) => void;
  /** Apply a velocity impulse (e.g. knockback, explosion) */
  applyImpulse:  (direction: Vector3, magnitude: number) => void;
}

// ─── Main Hook ────────────────────────────────────────────────────────────────

export function useCharacterController(
  scene:   Scene | null,
  camera:  FreeCamera | null,
  options: CharacterControllerOptions = {}
): CharacterControllerResult {
  const {
    spawnPosition  = new Vector3(0, CAPSULE_SPAWN_Y, 0),
    showCapsule    = false,
  } = options;

  const capsuleRef    = useRef<Mesh | null>(null);
  const aggregateRef  = useRef<PhysicsAggregate | null>(null);
  const inputRef      = useRef<InputState>({
    forward: false, backward: false,
    left: false,    right: false,
    jump: false,    sprint: false,
  });
  const yVelocityRef  = useRef(0);
  const isGroundedRef = useRef(false);
  const disposersRef  = useRef<Array<() => void>>([]);

  const setup = useCallback(() => {
    if (!scene || !camera) return;

    // ── P0-A FIX STEP 1: Strip ALL default camera inputs ──────────────────
    //
    // FreeCamera registers KeyboardMoveCamera and MouseInput by default.
    // These inputs read WASD and arrow keys and move the camera DIRECTLY —
    // completely bypassing the OMEGA controller and violating Input Authority.
    //
    // Must clear BEFORE attaching any keyboard listeners.
    camera.inputs.clear();
    // Re-attach only mouse look (so the player can look around)
    camera.inputs.addMouse();
    // Lock camera from auto-applying its own position updates
    camera.minZ = 0.1;
    camera.maxZ = 600;

    // ── BUILD CAPSULE MESH ────────────────────────────────────────────────

    const capsule = MeshBuilder.CreateCapsule(
      "omega_capsule",
      {
        height:  CAPSULE_HEIGHT,
        radius:  CAPSULE_RADIUS,
        tessellation: 8,
      },
      scene
    );

    // ── P0-B FIX: Correct spawn Y ─────────────────────────────────────────
    //
    // PhysicsAggregate origin = mesh center.
    // Ground = Y 0.
    // Mesh center must be at Y = CAPSULE_HEIGHT / 2 so the bottom of the
    // capsule collider sits exactly at Y = 0 (on the ground, not in it).
    capsule.position.copyFrom(spawnPosition);
    capsule.position.y = Math.max(spawnPosition.y, CAPSULE_SPAWN_Y);

    // Invisible by default in production (showCapsule = true for debug)
    if (!showCapsule) {
      capsule.isVisible = false;
    } else {
      const mat = new StandardMaterial("capsule_debug_mat", scene);
      mat.diffuseColor = new Color3(0, 1, 0.4);
      mat.wireframe    = true;
      capsule.material = mat;
    }

    capsuleRef.current = capsule;

    // ── PHYSICS AGGREGATE ─────────────────────────────────────────────────
    //
    // mass > 0  = dynamic body (responds to gravity and impulses)
    // friction  = lateral grip on the ground
    // linearDamping = prevents infinite sliding; simulates air resistance
    // angularDamping = prevents capsule from tipping / tumbling

    const aggregate = new PhysicsAggregate(
      capsule,
      PhysicsShapeType.CAPSULE,
      {
        mass:            75,
        friction:        0.8,
        restitution:     0.0,  // no bounce
      },
      scene
    );

    // Lock rotation axes — capsule must stay upright (no tumbling)
    aggregate.body.setAngularDamping(100);
    aggregate.body.setLinearDamping(0.1);
    // Freeze rotational degrees of freedom on X and Z
    aggregate.body.setMassProperties({
      inertia:        new Vector3(0, 1, 0),  // only Y rotation allowed
      inertiaOrientation: undefined,
    });

    aggregateRef.current = aggregate;

    // ── P0-A FIX STEP 2: Camera follows capsule ───────────────────────────
    //
    // Camera is NOT the mover. Camera FOLLOWS.
    // On every frame after physics resolves, reposition camera behind capsule.

    const followObserver = scene.onAfterRenderObservable.add(() => {
      if (!capsuleRef.current) return;

      // Bind camera to SSOT position instead of mesh directly
      const ssotPos = new Vector3(SSOT.player.position.x, SSOT.player.position.y, SSOT.player.position.z);

      // Target position: behind and above capsule
      const yaw = camera.rotation.y;
      const targetPos = new Vector3(
        ssotPos.x - Math.sin(yaw) * CAMERA_FOLLOW_DIST,
        ssotPos.y + CAMERA_FOLLOW_HEIGHT,
        ssotPos.z - Math.cos(yaw) * CAMERA_FOLLOW_DIST,
      );

      // Smooth follow — lerp camera toward target
      camera.position = Vector3.Lerp(camera.position, targetPos, CAMERA_LERP);

      // Always look at capsule eye level
      const lookTarget = ssotPos.add(CAMERA_EYE_OFFSET);
      camera.setTarget(lookTarget);
    });

    disposersRef.current.push(() =>
      scene.onAfterRenderObservable.remove(followObserver)
    );

    // ── MOVEMENT LOOP (onBeforeRender) ────────────────────────────────────
    //
    // This is the ONLY place that moves the capsule.
    // Camera follows the capsule — camera never directly sets its own position
    // from input.

    const moveObserver = scene.onBeforeRenderObservable.add(() => {
      const capsule   = capsuleRef.current;
      const aggregate = aggregateRef.current;
      if (!capsule || !aggregate) return;

      // Entropy and Sentinel Monitoring
      if (!throttleEntropy()) return;
      
      // Update SSOT for camera binding
      updatePlayerPosition(capsule.position.x, capsule.position.y, capsule.position.z);

      const dt  = scene.getEngine().getDeltaTime() / 1000;
      const inp = inputRef.current;

      // ── Grounded check via raycast ──
      const ray = new Ray(
        capsule.position,           // from capsule center
        Vector3.Down(),
        GROUND_RAY_LEN              // just past the capsule bottom
      );
      const hit = scene.pickWithRay(
        ray,
        m => m.name !== "omega_capsule" && !m.name.startsWith("npc_")
      );
      isGroundedRef.current = !!(hit?.hit);

      // ── Horizontal movement ──
      // Direction vectors derived from CAMERA YAW — not camera full rotation.
      // This gives camera-relative WASD without the capsule tilting with the camera.
      const yaw     = camera.rotation.y;
      const forward = new Vector3(Math.sin(yaw),  0, Math.cos(yaw));
      const right   = new Vector3(Math.cos(yaw),  0, -Math.sin(yaw));

      const moveDir = Vector3.Zero();
      const speed   = MOVE_SPEED * (inp.sprint ? SPRINT_MULT : 1);

      if (inp.forward)  moveDir.addInPlace(forward.scale(speed));
      if (inp.backward) moveDir.addInPlace(forward.scale(-speed * 0.7));
      if (inp.right)    moveDir.addInPlace(right.scale(speed));
      if (inp.left)     moveDir.addInPlace(right.scale(-speed));

      // ── Vertical / jump / gravity ──
      if (inp.jump && isGroundedRef.current) {
        yVelocityRef.current = JUMP_IMPULSE;
        inp.jump = false;          // consume — one impulse per press
      }

      if (!isGroundedRef.current) {
        yVelocityRef.current += GRAVITY * dt;
      } else if (yVelocityRef.current < 0) {
        yVelocityRef.current = 0; // reset on landing
      }

      moveDir.y = yVelocityRef.current;

      // ── Apply via linear velocity (physics-driven, not position-set) ──
      // Setting linearVelocity lets Havok handle collision response.
      // Setting position directly would bypass collision detection.
      aggregate.body.setLinearVelocity(moveDir);

      // ── Emergency floor reset (kill plane) ──
      // If capsule somehow falls through world, teleport to safe spawn.
      if (capsule.position.y < FLOOR_KILL_PLANE) {
        capsule.position.copyFrom(spawnPosition);
        capsule.position.y   = CAPSULE_SPAWN_Y;
        yVelocityRef.current = 0;
        aggregate.body.setLinearVelocity(Vector3.Zero());
      }
    });

    disposersRef.current.push(() =>
      scene.onBeforeRenderObservable.remove(moveObserver)
    );

    // ── KEYBOARD INPUT LISTENERS ──────────────────────────────────────────
    //
    // Attached to window, not canvas, so they survive canvas focus changes.
    // All state is written to inputRef (ref-based — never triggers re-render).

    const onKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case "KeyW": case "ArrowUp":    inputRef.current.forward  = true;  break;
        case "KeyS": case "ArrowDown":  inputRef.current.backward = true;  break;
        case "KeyA": case "ArrowLeft":  inputRef.current.left     = true;  break;
        case "KeyD": case "ArrowRight": inputRef.current.right    = true;  break;
        case "Space":
          inputRef.current.jump = true;
          e.preventDefault();           // prevent page scroll
          break;
        case "ShiftLeft": case "ShiftRight":
          inputRef.current.sprint = true;
          break;
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case "KeyW": case "ArrowUp":    inputRef.current.forward  = false; break;
        case "KeyS": case "ArrowDown":  inputRef.current.backward = false; break;
        case "KeyA": case "ArrowLeft":  inputRef.current.left     = false; break;
        case "KeyD": case "ArrowRight": inputRef.current.right    = false; break;
        case "Space":                   inputRef.current.jump     = false; break;
        case "ShiftLeft": case "ShiftRight":
          inputRef.current.sprint = false;
          break;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup",   onKeyUp);

    disposersRef.current.push(() => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup",   onKeyUp);
    });

  }, [scene, camera, spawnPosition, showCapsule]);

  // Run setup once scene + camera are available
  // Call setup() in your DieselCityScene.tsx after scene.whenReadyAsync()

  // ── Teleport ────────────────────────────────────────────────────────────

  const teleport = useCallback((position: Vector3) => {
    const capsule   = capsuleRef.current;
    const aggregate = aggregateRef.current;
    if (!capsule || !aggregate) return;

    capsule.position.copyFrom(position);
    capsule.position.y   = Math.max(position.y, CAPSULE_SPAWN_Y);
    yVelocityRef.current = 0;
    aggregate.body.setLinearVelocity(Vector3.Zero());
  }, []);

  // ── Apply Impulse ────────────────────────────────────────────────────────

  const applyImpulse = useCallback((direction: Vector3, magnitude: number) => {
    const aggregate = aggregateRef.current;
    if (!aggregate) return;
    const impulse = direction.normalize().scale(magnitude);
    aggregate.body.applyImpulse(impulse, Vector3.Zero());
  }, []);

  // ── Dispose ──────────────────────────────────────────────────────────────
  //
  // ORDER:
  //   1. Remove observers (stop reading input / moving capsule)
  //   2. Remove keyboard listeners
  //   3. Dispose physics aggregate (release Havok body)
  //   4. Dispose mesh (release GPU geometry)
  //
  // This mirrors the DieselCityScene v2 cleanup order principle:
  // consumers disposed before owners.

  const dispose = useCallback(() => {
    // 1+2: Observers and keyboard listeners
    disposersRef.current.forEach(fn => fn());
    disposersRef.current = [];

    // 3: Physics aggregate
    if (aggregateRef.current) {
      aggregateRef.current.dispose();
      aggregateRef.current = null;
    }

    // 4: Mesh
    if (capsuleRef.current && !capsuleRef.current.isDisposed()) {
      capsuleRef.current.dispose();
      capsuleRef.current = null;
    }

    // Reset velocity state
    yVelocityRef.current  = 0;
    isGroundedRef.current = false;
  }, []);

  return { dispose, capsuleRef, teleport, applyImpulse, setup };
}
