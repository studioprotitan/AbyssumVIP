// ============================================================
// GenesisVerse_PlayerController_v2.js
// Fixes the Controller vs Visual Model mismatch in v1.html
// Generated from Cross-Chat Handoff — March 23 2026
// ============================================================
//
// WHAT WAS WRONG IN GEMINI'S v1 PATCH (Document 6):
//   LOCOMOTION.tick(dt, playerMesh)     ← WRONG — mesh ≠ controller
//   camera.setTarget(playerMesh.position) ← WRONG — mesh root unstable
//   ANIM_CONTROLLER.loadAll(playerMesh) ← partially ok but fragile
//
// CORRECT ARCHITECTURE (matches AbyssumVIP / CharacterController.ts):
//   capsule   = physics controller (hidden)
//   playerMesh = visual layer only (parented to capsule)
//   LOCOMOTION.tick(dt, capsule)
//   camera.lockedTarget = capsule
//   ANIM_CONTROLLER.loadAll(playerMesh)
//
// ============================================================

const SCHEMA = {
  version: '2.0',
  GLB_BASE_PATH: './Animations/',
  CHARACTER_MODEL: 'character',
  CLIPS: {
    idle:   'idle',
    walk:   'walk',
    run:    'run',
    attack: 'attack',
    deploy: 'deploy',
  },
};

async function initPlayerController(scene, camera, HUD) {

  // ── STEP 1: Spawn physics capsule (ALWAYS — even if GLB fails) ──
  //
  // The capsule is the controller. It exists unconditionally.
  // The GLB is cosmetic. It may fail — the capsule never fails.

  const capsule = BABYLON.MeshBuilder.CreateCapsule('playerCollider', {
    radius: 0.4,
    height: 1.8,
    tessellation: 8,
  }, scene);

  capsule.position.y = 0.9;      // feet at y=0
  capsule.isVisible = false;     // hidden — GLB renders on top
  capsule.checkCollisions = true;
  capsule.ellipsoid = new BABYLON.Vector3(0.4, 0.9, 0.4);
  capsule.ellipsoidOffset = new BABYLON.Vector3(0, 0.9, 0);

  // Head indicator (dev helper — remove in prod)
  // Parented to capsule, not to playerMesh
  const head = BABYLON.MeshBuilder.CreateSphere('head', { diameter: 0.3 }, scene);
  head.position.y = 0.7;
  head.position.z = 0.25;
  head.parent = capsule;
  const headMat = new BABYLON.StandardMaterial('headMat', scene);
  headMat.diffuseColor = new BABYLON.Color3(1, 0.7, 0.3);
  head.material = headMat;

  // ── STEP 2: Load GLB visual mesh ──────────────────────────────
  //
  // On success: parent to capsule, reset transform, hide capsule.
  // On failure: capsule stays visible as fallback — game still works.

  let playerMesh = null;

  try {
    HUD.log(`Loading: ${SCHEMA.CHARACTER_MODEL}.glb`);

    const result = await BABYLON.SceneLoader.ImportMeshAsync(
      '',
      SCHEMA.GLB_BASE_PATH,
      SCHEMA.CHARACTER_MODEL + '.glb',
      scene
    );

    // Find the actual root — meshes[0] is sometimes a transform node
    // not the renderable mesh. __root__ is Babylon's standard name.
    playerMesh = result.meshes.find(m => m.name === '__root__')
      ?? result.meshes[0];

    // Parent visual mesh to physics capsule
    playerMesh.parent = capsule;

    // Reset transform — capsule owns position/rotation
    playerMesh.position = BABYLON.Vector3.Zero();
    playerMesh.rotation = BABYLON.Vector3.Zero();
    playerMesh.scaling  = new BABYLON.Vector3(1, 1, 1);

    // Visual mesh does NOT check collisions — capsule does
    playerMesh.checkCollisions = false;

    // Hide capsule now that GLB is visible
    capsule.isVisible = false;
    head.isVisible    = false;

    HUD.log('Player model loaded — parented to capsule');

  } catch (e) {
    HUD.log('GLB load failed — running on capsule fallback', 'warn');

    // Make capsule visible as fallback character
    capsule.isVisible = true;
    const capMat = new BABYLON.StandardMaterial('capMat', scene);
    capMat.diffuseColor = new BABYLON.Color3(0.9, 0.48, 0.11);
    capsule.material = capMat;

    // playerMesh stays null — systems that need it check below
  }

  // ── STEP 3: Camera — lock to CAPSULE, not mesh ────────────────
  //
  // capsule.position is stable (physics primitive).
  // playerMesh root position is NOT stable — bones and animations
  // move the hierarchy, making the root jitter under camera follow.

  camera.lockedTarget = capsule;   // ← correct: set once, never per-frame

  // ── STEP 4: Input ─────────────────────────────────────────────

  INPUT.init();

  // ── STEP 5: Animations — load onto MESH, not capsule ──────────
  //
  // ANIM_CONTROLLER targets the visual mesh (bones live there).
  // If playerMesh is null (GLB failed), loadAll returns 0 and
  // the state machine runs dry — movement still works via capsule.

  let loadedClips = 0;
  if (playerMesh) {
    try {
      loadedClips = await ANIM_CONTROLLER.loadAll(playerMesh);
      HUD.log(`${loadedClips} animation clips loaded`);
    } catch (e) {
      HUD.log('Anim load error — state machine running dry', 'warn');
    }
  } else {
    HUD.log('No mesh — skipping animation load', 'warn');
  }

  // ── STEP 6: Render / tick loop ────────────────────────────────
  //
  // ALL movement systems use CAPSULE.
  // Animation systems use playerMesh (may be null — state machine handles it).

  let lastTime = performance.now();

  scene.onBeforeRenderObservable.add(() => {
    const now = performance.now();
    const dt  = Math.min((now - lastTime) / 1000, 0.05); // cap at 50ms
    lastTime  = now;

    STATE_MACHINE.tick(dt);

    // LOCOMOTION moves the CAPSULE — this is the fix
    LOCOMOTION.tick(dt, capsule);

    HUD.update();
  });

  // ── STEP 7: SSOT position read-back ──────────────────────────
  //
  // Mirror capsule position to SSOT every frame.
  // Matches the AbyssumVIP CharacterController pattern exactly.

  scene.onAfterPhysicsObservable?.add(() => {
    if (typeof SSOT !== 'undefined' && SSOT.player?.position) {
      SSOT.player.position.x = capsule.position.x;
      SSOT.player.position.y = capsule.position.y - 0.9; // center → feet
      SSOT.player.position.z = capsule.position.z;
    }
  });

  return { capsule, playerMesh };
}

// ── Authority table (matches Document 5 verdict) ─────────────
//
// System       Uses Capsule    Uses Mesh
// Movement         YES            NO
// Collision        YES            NO
// Camera           YES            NO
// Animation        NO             YES
// Rendering        NO             YES
