#!/bin/bash
# ══════════════════════════════════════════════════════════════
#  CST_NPC_SORT.sh
#  Run from the project ROOT (E:\) — sorts avatar pool GLBs
#  into the correct NPC subfolders under Characters/NPC/
#  Also creates the Weapons/Steampunk_Arsenal subfolder stubs.
#
#  USAGE:
#    bash CST_NPC_SORT.sh          # dry run (prints what it would do)
#    bash CST_NPC_SORT.sh --move   # actually moves the files
# ══════════════════════════════════════════════════════════════

ROOT="$(pwd)"
AVATARS="$ROOT/Characters/avatars"
NPC="$ROOT/Characters/NPC"
PROPS="$ROOT/Props"
WEAPONS="$ROOT/Weapons/Steampunk_Arsenal"

DRY=true
[[ "$1" == "--move" ]] && DRY=false

log() { echo "[CST-SORT] $*"; }
move() {
  SRC="$1" DEST_DIR="$2" DEST_FILE="${3:-$(basename "$1")}"
  DEST="$DEST_DIR/$DEST_FILE"
  if [[ ! -f "$SRC" ]]; then
    log "  SKIP (not found): $SRC"
    return
  fi
  if $DRY; then
    log "  DRY: $SRC  →  $DEST"
  else
    mkdir -p "$DEST_DIR"
    mv -v "$SRC" "$DEST"
    log "  MOVED: $(basename "$SRC") → $DEST_DIR/"
  fi
}
ensure_dir() {
  if $DRY; then
    log "  DIR: mkdir -p $1"
  else
    mkdir -p "$1"
    log "  DIR created: $1"
  fi
}

log "═══════════════════════════════════════"
log " ENIGMATIC UNIVERSES — NPC SORT SCRIPT"
log " DRY RUN: $DRY  (--move to execute)"
log "═══════════════════════════════════════"

# ── NPC: RIFT RATS ──────────────────────────────────────────
log ""
log "── NPC/RiftRats ──"
ensure_dir "$NPC/RiftRats"
move "$AVATARS/rift-rat-abomination-01.glb"         "$NPC/RiftRats"
move "$AVATARS/rift-rat-abomination.glb"             "$NPC/RiftRats"
move "$AVATARS/rift-rat-abomination (2).glb"         "$NPC/RiftRats" "rift-rat-abomination-03.glb"
move "$AVATARS/rift-rat-monster.glb"                 "$NPC/RiftRats"
move "$AVATARS/rift-rat-wendigo.glb"                 "$NPC/RiftRats"
move "$PROPS/Biomes/rift-raft-soverign-scout.glb"    "$NPC/RiftRats" "rift-rat-sovereign-scout.glb"
move "$AVATARS/rat-pack-racer.glb"                   "$NPC/RiftRats"
move "$AVATARS/rat-pack-racer-miglia.glb"            "$NPC/RiftRats"

# ── NPC: GLITCH WITCH ───────────────────────────────────────
log ""
log "── NPC/GlitchWitch ──"
ensure_dir "$NPC/GlitchWitch"
move "$AVATARS/cst-glitch-helm.glb"                  "$NPC/GlitchWitch"
move "$NPC/GlitchGoblin/glitch-goblin-corgemont.glb" "$NPC/GlitchWitch" "glitch-goblin-corgemont.glb"
move "$AVATARS/glitch-goblin.glb"                    "$NPC/GlitchWitch"
move "$AVATARS/glitch-goblin-metro-punk.glb"         "$NPC/GlitchWitch"
move "$PROPS/Automatons/glitch-goblin-yellow.glb"    "$NPC/GlitchWitch" "glitch-goblin-yellow.glb"

# ── NPC: SALVAGERS ──────────────────────────────────────────
log ""
log "── NPC/Salvagers ──"
ensure_dir "$NPC/Salvagers"
move "$AVATARS/salvager-mechanist-rail-boss.glb"     "$NPC/Salvagers"
move "$AVATARS/mechanist-salvager.glb"               "$NPC/Salvagers"
move "$AVATARS/cst-escort-rail-raider.glb"           "$NPC/Salvagers"

# ── NPC: CROC MEN ───────────────────────────────────────────
log ""
log "── NPC/CrocMen ──"
ensure_dir "$NPC/CrocMen"
log "  INFO: No CrocMen GLBs found in avatars — generate via Tripo3D or import FBX"

# ── NPC: DROWNED ONES ───────────────────────────────────────
log ""
log "── NPC/DrownedOnes ──"
ensure_dir "$NPC/DrownedOnes"
log "  INFO: No DrownedOnes GLBs found in avatars — generate via Tripo3D or import FBX"

# ── NPC: GOLEMS ─────────────────────────────────────────────
log ""
log "── NPC/Golems ──"
ensure_dir "$NPC/Golems"
move "$AVATARS/gian-golem.glb"                       "$NPC/Golems" "giant-golem.glb"
move "$AVATARS/giant-golem-titan.glb"                "$NPC/Golems"
move "$AVATARS/giant-golem-a.glb"                    "$NPC/Golems"
move "$AVATARS/dcst-titan-golem.glb"                 "$NPC/Golems"
move "$AVATARS/cursed-colossus.glb"                  "$NPC/Golems"
move "$AVATARS/cursed-automaton.glb"                 "$NPC/Golems"

# ── ABEX BANKERS — move JPEG portraits if missing ───────────
log ""
log "── Characters/ABEXBankers ──"
ensure_dir "$ROOT/Characters/ABEXBankers"

# ── WEAPONS — move from avatars pool ────────────────────────
log ""
log "── Weapons/Steampunk_Arsenal ──"
ensure_dir "$WEAPONS/Pistol"
ensure_dir "$WEAPONS/AssaultRifle"
ensure_dir "$WEAPONS/Grenades"
ensure_dir "$WEAPONS/SniperRifle"
ensure_dir "$WEAPONS/Shotgun"
ensure_dir "$WEAPONS/WaveGun"
ensure_dir "$WEAPONS/FlameThrower"

move "$AVATARS/pistol.glb"                           "$WEAPONS/Pistol"
move "$AVATARS/chrono-revolver.glb"                  "$WEAPONS/Pistol" "chrono-revolver-pistol.glb"
move "$AVATARS/cst-crono-revolver.glb"               "$WEAPONS/Pistol" "cst-chrono-revolver.glb"
move "$AVATARS/weapon-crono.glb"                     "$WEAPONS/Pistol" "weapon-crono-pistol.glb"

# ── PROPS — sort boundary stones out of avatars ──────────────
log ""
log "── Props/Boundary_Stones GLBs ──"
ensure_dir "$PROPS/Boundary_Stones"
move "$AVATARS/boundary-stone-01.glb"               "$PROPS/Boundary_Stones"
move "$AVATARS/boundary-stone.glb"                  "$PROPS/Boundary_Stones"

# ── PROPS — sort wristwatch ──────────────────────────────────
log ""
log "── Props — Wristwatch / Smart Watch ──"
move "$AVATARS/wristwatch.glb"                      "$PROPS" "wristwatch-glb-oracle.glb"

# ── LEVELS — sort level-specific props ──────────────────────
log ""
log "── Levels/EngineHall — engine room assets ──"
ensure_dir "$ROOT/Levels/EngineHall"
move "$PROPS/Corgemont_Engine_Room_Colosus_Class/corgemont-engines-colossus-relics.glb" "$ROOT/Levels/EngineHall"
move "$PROPS/Corgemont_Engine_Room_Colosus_Class/cst-silver-line-trooper.glb"           "$ROOT/Levels/EngineHall"

# ── SUMMARY ─────────────────────────────────────────────────
log ""
log "═══════════════════════════════════════"
if $DRY; then
  log " DRY RUN COMPLETE — run with --move to execute"
  log " Affected GLBs will be moved to correct NPC/Weapon/Level folders"
else
  log " SORT COMPLETE"
  log " Check Characters/NPC/ subfolders for sorted assets"
fi
log "═══════════════════════════════════════"
