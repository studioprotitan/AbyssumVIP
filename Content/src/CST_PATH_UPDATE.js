// ══════════════════════════════════════════════════════════════
//  CST_PATH_UPDATE.md
//  Apply these changes to index.html and CST_M01_PLAY_LOOP_v2.html
//  Reason: scene-mint-deploy-walk.glb confirmed live in Babylon.js
//  Date: 2026-03-20
// ══════════════════════════════════════════════════════════════

// ── INDEX.HTML ──────────────────────────────────────────────
// FIND:
const WALK_PATH  = BASE + 'Characters/Players/Animation/StellarWoman/';
const WALK_FILE  = 'AS_UE5_MF_Walk_Fwd.gltf';
const FALLBACK_PATH = BASE + 'Characters/Players/Animation/StellarWoman/';
const FALLBACK_FILE  = 'AS_UE5_MF_Idle.gltf';

// REPLACE WITH:
const WALK_PATH  = BASE + 'Characters/Players/Animation/StellarWoman/';
const WALK_FILE  = 'scene-mint-deploy-walk.glb';
const FALLBACK_PATH = BASE + 'Characters/Players/Animation/StellarWoman/';
const FALLBACK_FILE  = 'AS_Idle.gltf';   // AS_Idle.gltf exists as confirmed fallback


// ── CST_M01_PLAY_LOOP_v2.html ────────────────────────────────
// FIND:
const WALK_PATH = BASE + 'Characters/Players/Animation/StellarWoman/';
const WALK_FILE = 'AS_UE5_MF_Walk_Fwd.gltf';
const IDLE_PATH = BASE + 'Characters/Players/Animation/StellarWoman/';
const IDLE_FILE = 'AS_UE5_MF_Idle.gltf';

// REPLACE WITH:
const WALK_PATH = BASE + 'Characters/Players/Animation/StellarWoman/';
const WALK_FILE = 'scene-mint-deploy-walk.glb';
const IDLE_PATH = BASE + 'Characters/Players/Animation/StellarWoman/';
const IDLE_FILE = 'AS_Idle.gltf';


// ── NAMING CONVENTION — LOCKED ───────────────────────────────
// ALL future UE5 exports use this schema:
//
//   scene-mint-deploy-[animation].glb
//
//   scene-mint-deploy-walk.glb        ✅ CONFIRMED LIVE
//   scene-mint-deploy-idle.glb        ⏳ NEXT EXPORT
//   scene-mint-deploy-run.glb         ⏳ NEXT EXPORT
//   scene-mint-deploy-attack.glb      ⏳ QUEUE
//   scene-mint-deploy-jump.glb        ⏳ QUEUE
//   scene-mint-deploy-death.glb       ⏳ QUEUE
//
// GLB (not GLTF) = self-contained, textures embedded
// Eliminates all external PNG dependency on load
// Single path = single asset card in Card Captor
// Single token = one Mint to Deploy action per character state
//
// For StellarMAN exports, use:
//   scene-mint-deploy-man-[animation].glb
//
// For NPC exports, use:
//   scene-mint-deploy-npc-[name]-[animation].glb
//   e.g. scene-mint-deploy-npc-glitchwitch-idle.glb


// ── WHY THIS MATTERS FOR MINT TO DEPLOY ─────────────────────
// The GLB naming directly maps to the ERC-1155 token system:
//
//   Token ID → Asset → GLB filename
//   #001     → Phase Spy (Idle)    → scene-mint-deploy-npc-phasespy-idle.glb
//   #002     → Phase Spy (Walk)    → scene-mint-deploy-npc-phasespy-walk.glb
//   #003     → Stellar Woman Walk  → scene-mint-deploy-walk.glb
//   #004     → Stellar Woman Run   → scene-mint-deploy-run.glb
//
// When minted: tokenId written to Supabase → game reads tokenId → 
// loads correct GLB from path → character state is on-chain verified
//
// This is the full Mint to Deploy pipeline now validated.
