# NEXT SESSION EXECUTION PLAN
# Abyssum / Enigmatic Universes — Post Handoff
# Date: March 23 2026 | Commander: Antonio
# ============================================================

## BEFORE OPENING EDITOR — RUN THESE FIRST

```bash
# 1. Verify clean state
cd ~/studio && git status
# Expected: nothing to commit, working tree clean

# 2. Confirm Forge-Avatars CDN is live
curl -I https://your-cdn-url/avatars/scene-mint-deploy-walk.glb
# Expected: HTTP 200

# 3. Dry run NPC sort — READ ONLY, no files move
pwsh ./CST_NPC_SORT.ps1 -DryRun
# Read the output. Confirm paths look right before -Move
```

---

## PRIORITY 1 — GLB Compression (do this first, blocks everything else)

```bash
# Install gltf-transform if not present
npm install -g @gltf-transform/cli

# Compress walk GLB — Draco geometry + meshopt animation
gltf-transform optimize \
  ./Forge-Avatars/models/scene-mint-deploy-walk.glb \
  ./Forge-Avatars/models/scene-mint-deploy-walk-compressed.glb \
  --compress draco

# Check output size — target under 5MB
ls -lh ./Forge-Avatars/models/scene-mint-deploy-walk-compressed.glb

# If acceptable, replace and push
cp scene-mint-deploy-walk-compressed.glb scene-mint-deploy-walk.glb
cd Forge-Avatars && git add models/ && git commit -m "compress: walk GLB Draco" && git push
```

---

## PRIORITY 2 — Export idle.glb from UE5

In UE5 FreeAnimationLibrary:
1. Open Idle animation asset
2. Export → FBX with skeleton
3. In Blender: File → Import FBX → select idle.fbx
4. File → Export → glTF 2.0
   - Format: glTF Binary (.glb)
   - Include: Selected Objects + Animations
   - Output: ./Forge-Avatars/models/scene-mint-deploy-idle.glb
5. Run gltf-transform optimize on output (same as Priority 1)
6. Push to Forge-Avatars/models/

---

## PRIORITY 3 — NPC Sort (only after dry run confirms)

```powershell
# ONLY run this after reading dry run output
pwsh ./CST_NPC_SORT.ps1 -Move

# Then verify
ls ./NPC/GlitchWitch/   # should no longer be empty
ls ./NPC/RiftRats/
ls ./NPC/Glitch_Goblins/
```

---

## PRIORITY 4 — KitBash IronForge import

Target path: Levels/EngineHall/KitBash_IronForge/

In Babylon / Next.js scene:
1. Confirm IronForge download is complete in Cargo app
2. Export needed meshes as GLB (individual pieces or combined)
3. Drop into Levels/EngineHall/KitBash_IronForge/
4. Load in DieselCityScene.tsx using SceneLoader.ImportMeshAsync
   - Use isMounted guard after every await (fb48640 pattern)
   - Static meshes: PhysicsShapeType.MESH (not CAPSULE)
   - Do NOT use dynamic physics on static set-dressing

---

## PRIORITY 5 — Oracle AI Phase 3 (Train Escort)

Drop PlayerController into the Train Escort scene:

```tsx
// In Oracle AI Train Escort component:
import PlayerController from '@/components/features/PlayerController';

// Add alongside existing scene elements:
<PlayerController
  showHUD={true}
  autoLoad={true}
  onWalletConnect={(addr) => console.log('Connected:', addr)}
  onStateChange={(stats) => {
    UIOrchestrator.updateSmartWatch(toSmartWatchPayload(stats));
  }}
/>
// No environment rebuild needed — character walks into existing scene
```

---

## PRIORITY 6 — BattleArena + Stripe wiring

```tsx
// In BattleArena.tsx:
import PlayerController from './PlayerController';

<PlayerController
  showHUD={true}
  autoLoad={true}
  onWalletConnect={(addr) => console.log('Connected:', addr)}
  onStateChange={(stats) => {
    UIOrchestrator.updateSmartWatch(toSmartWatchPayload(stats));
  }}
/>
```

```bash
# Stripe install
npm install stripe

# Add to .env.local:
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## OPEN ISSUES — DO NOT FORGET

| Issue                    | Status     | Action needed                          |
|--------------------------|------------|----------------------------------------|
| Witch Boots              | Missing    | Tree scan: find . -name "*witch*boot*" |
| StellarMan Walk GLB      | Not exported | UE5 export same as idle above        |
| cst-swat-anim FBX        | Needs convert | Blender FBX → GLB pipeline          |
| NPC/GlitchWitch/ folder  | Empty      | After -Move sort confirms             |
| GenesisVerse controller  | FIXED v2   | Deploy GenesisVerse_PlayerController_v2.js |

---

## GenesisVerse fix — deploy immediately at session start

Replace the v1 init logic in GenesisVerse_PlayerController_v1.html
with GenesisVerse_PlayerController_v2.js.

Key change: LOCOMOTION.tick(dt, capsule) not playerMesh.
Key change: camera.lockedTarget = capsule not setTarget(playerMesh.position).
Key change: playerMesh.parent = capsule — mesh is visual only.

This closes the camera jitter, animation drift, and
collision bugs identified in the cross-chat audit.

---

## COMMIT MESSAGE TEMPLATE for next session

feat(phase-8-4): [description]

- SSOT: [what changed]
- MOAI: [what broadcast]
- Sentinel: [what logged]
- Guards: [RAF gate / null-program / isMounted — which apply]

Closes: [issue or phase step]
