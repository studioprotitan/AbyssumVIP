---

### **V1.5 - March 20, 2026: CST Deployment Bridge — GLB Pipeline + Combat Controller**

**STATUS: FEATURE BRANCH STAGED — `feature/cst-deployment-v1`**

**CLASSIFICATION: OMEGA CLEARANCE**

The CST standalone HTML arc and the NexusVerse React application have been formally bridged. This version establishes the Mint-to-Deploy naming convention, deploys the standalone ENIGMATIC UNIVERSES ops console, and produces the production-grade Babylon.js CharacterController for NexusVerse integration.

---

#### **MILESTONE: `scene-mint-deploy-walk.glb` CONFIRMED LIVE**

- First production GLB exported from UE5 `CryptoCardDash` project under the locked naming convention.
- Confirmed in Babylon.js VS Code viewer (v0.9.4) at full texture fidelity — orange CST trooper suit, all material channels baked, single self-contained file.
- **Shading model issue resolved implicitly** — UE5 GLB export converts Subsurface Profile and Hair shading to PBR automatically. No export override materials required.
- Naming convention locked: `scene-mint-deploy-[anim].glb` (female), `scene-mint-deploy-man-[anim].glb` (male), `scene-mint-deploy-npc-[name]-[anim].glb` (NPC).

#### **STAGED FILES**

**Core Application (`/src`)**
- `PilotDeployLobby.tsx` — React component for Pilot Deploy lobby (Screen 2).
- `VideoTransmissionWindow.tsx` — 9:16 Video HUD component for transmission signals.
- `playerState.defaults.ts` — Player state definitions, type safety, inventory guards.
- `CharacterController.ts` — Production Babylon.js controller. Loads `scene-mint-deploy-*.glb`, implements combat state machine (idle / walk / run / attack / deploy / death), auto-fallback for missing animation exports, SmartWatch bridge via `toSmartWatchPayload()`.

**Asset Utilities**
- `CST_NPC_SORT.ps1` — PowerShell script to sort 120+ avatars pool GLBs into correct NPC subfolders (RiftRats, GlitchWitch, Salvagers, Golems, Weapons).
- `CST_NAV_PATCH.js` — Episode navigation bar + padding fix. Inject into EP01–EP04 before `</body>`.
- `CST_PATH_UPDATE.js` — GLB path constants and Mint-to-Deploy token ID → filename mapping.

**HTML Standalone Suite (`/HTML/src/HTML/`)**
- `index.html` — ENIGMATIC UNIVERSES landing page. Babylon.js hero viewport loads `scene-mint-deploy-walk.glb`. Left ops panel + right DAPP panel + 12-tile codex rail. Live localStorage reads for stone/card/ERT status.
- `CST_MISSION_HUB_v2.html` — Card Captor, Mint to Deploy modal, ABEX/GDEX live gas fuel gauge, AI Intel deck (Oracle AVX via Anthropic API), ERT 3-lock Easter Egg system.
- `CST_M01_PLAY_LOOP_v2.html` — First testable Stone Recovery play loop. Smart Watch (Pulse/Trace/Veil modes), mission dossier card, card deck, boundary stone imagery from real asset paths.
- `CST_EP01–EP04` — Cold Brew episodes with save chain and ERT transmission sequence.
- `CST_CHARACTER_VIEWER_DARK.html` — Babylon.js character viewer themed to Mission Hub aesthetic.

#### **ASSET STATE**
- **StellarWoman:** Idle ✅ · Run Fwd ✅ · Walk Fwd ✅ (`scene-mint-deploy-walk.glb`)
- **StellarMan:** Idle ✅ · Run Fwd ✅ · Walk pending
- **NPC folders:** RiftRats, GlitchWitch, Salvagers, Golems — folders exist, GLB sort pending (`CST_NPC_SORT.ps1 -Move`)
- **Boundary Stones:** 40+ concept images in `Props/Boundary_Stones/` · `boundary-stone.glb` + `boundary-stone-01.glb` in Props
- **Ritual HMI Crown:** `cst-ritual-helmet-yellow.glb` confirmed in `Props/Ritual_Helmet_CST_Yellow/`

#### **OPEN ISSUES**
- "Witch Boots" location: unknown — not found in tree scan
- Glitch Witch Totem signal: still active — `NPC/GlitchWitch/` folder empty pending sort
- StellarMan Walk Fwd: not yet exported from UE5
- `cst-swat-anim/tripo_convert_516f5f57.fbx` — needs GLB conversion before use

#### **NEXT PHASE**
- Phase 8.4: Wire `CharacterController.ts` into `SceneManager.ts` → `UIOrchestrator.tsx` → `SmartWatch.tsx`
- Export `scene-mint-deploy-idle.glb` from UE5 (same process as walk, confirmed working)
- Firebase migration: **March 22, 2027 deadline** — not critical path, proceed without urgency
- Aijian HTML comic assembler: next build session

#### **KEY DECISION: Firebase Studio Sunset**
Date confirmed as **March 22, 2027** — full year remaining. Migration from Firebase Studio to Vercel/Supabase proceeds as planned but is not blocking. NexusVerse continues development in Firebase Studio for the test environment while the standalone DAPP suite matures on the HTML layer.

---
