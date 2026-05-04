#!/usr/bin/env bash
# ================================================================
# COLD BREW: MYSTICS OF MAYHEM
# MASTER IMAGE RENAME SCRIPT — html_embeds folder
# Commander Antonio — CST-ERT Asset Pipeline
#
# USAGE:
#   1. Open Git Bash / WSL / Terminal on your Windows machine
#   2. cd to your html_embeds folder:
#      cd "E:/AbyssumVIP/Content/Images/public/images/html_embeds"
#   3. Run:  bash cb_rename_master.sh
#
# WHAT IT DOES:
#   • Renames every file in html_embeds to a clean cb-* slug
#   • All lowercase, hyphenated, no spaces, no parentheses
#   • Groups by faction/role for easy reference in HTML/CSS
#   • Preserves original extensions (.jpg .png .webp)
#   • Prints a rename log to cb_rename_log.txt
#   • DRY-RUN safe: set DRY_RUN=1 to preview without changing files
#
# FACTIONS:
#   cb-cst-*        Cold Brew / CST operative characters
#   cb-mystic-*     Abyssum mystic characters (a1-a9 series)
#   cb-rift-rat-*   Bipedal Rift Rat enemy units
#   cb-env-*        Environment / scene backgrounds
#   cb-prop-*       Props, alchemy boards, artefacts
# ================================================================

DRY_RUN=0   # Set to 1 to preview only, 0 to execute
LOG="cb_rename_log.txt"
echo "COLD BREW — MASTER RENAME LOG — $(date)" > "$LOG"
echo "================================================" >> "$LOG"

rename_file() {
  local OLD="$1"
  local NEW="$2"
  if [ -f "$OLD" ]; then
    if [ "$DRY_RUN" -eq 1 ]; then
      echo "[DRY-RUN] $OLD  →  $NEW" | tee -a "$LOG"
    else
      mv "$OLD" "$NEW"
      echo "[RENAMED] $OLD  →  $NEW" | tee -a "$LOG"
    fi
  else
    echo "[SKIP — not found] $OLD" | tee -a "$LOG"
  fi
}

echo ""
echo "▸ CST OPERATIVE CHARACTERS"
echo "──────────────────────────────────────────────"

# ── Numbered character sheets (1–8) → cold-brew-pilot series
rename_file "1.jpg"   "cb-cst-pilot-01.jpg"
rename_file "2.jpg"   "cb-cst-pilot-02.jpg"
rename_file "3.jpg"   "cb-cst-pilot-03.jpg"
rename_file "4.jpg"   "cb-cst-pilot-04.jpg"
rename_file "5.jpg"   "cb-cst-pilot-05.jpg"
rename_file "6.jpg"   "cb-cst-pilot-06.jpg"
rename_file "7.jpg"   "cb-cst-pilot-07.jpg"
rename_file "8.jpg"   "cb-cst-pilot-08.jpg"

# ── Named CST operatives
rename_file "cold-brew-mission-commander.jpg"           "cb-cst-commander.jpg"
rename_file "cst-medic.jpg"                             "cb-cst-medic.jpg"
rename_file "cst-sniper.jpg"                            "cb-cst-sniper.jpg"
rename_file "cst-witch.jpg"                             "cb-cst-witch.jpg"
rename_file "cst-undercity.jpg"                         "cb-cst-undercity.jpg"
rename_file "cst-pilot-officer.jpg"                     "cb-cst-pilot-officer.jpg"
rename_file "cst-patrol-officer.jpg"                    "cb-cst-patrol-officer.jpg"
rename_file "cst-patrol-officer-male.jpg"               "cb-cst-patrol-officer-male.jpg"
rename_file "cst-patrol-mpc.jpg"                        "cb-cst-patrol-mpc.jpg"
rename_file "cst-patrol-mpc-station-commander.jpg"      "cb-cst-patrol-station-cmdr.jpg"
rename_file "cst-patrol-glitch-squad.jpg"               "cb-cst-patrol-glitch-squad.jpg"
rename_file "cst-patrol-swamp-rail.jpg"                 "cb-cst-patrol-swamp-rail.jpg"
rename_file "cst-cargo-yards.jpg"                       "cb-cst-cargo-yards.jpg"
rename_file "cst-sewer-city-patrol-witch.jpg"           "cb-cst-sewer-patrol-witch.jpg"
rename_file "cst-station-manager.jpg"                   "cb-cst-station-manager.jpg"
rename_file "cst-train-and-rail-heavy-armor.jpg"        "cb-cst-train-rail-heavy.jpg"
rename_file "cst-train-engineer.jpg"                    "cb-cst-train-engineer.jpg"
rename_file "cst-train-escort.jpg"                      "cb-cst-train-escort.jpg"
rename_file "cst-portal-aparatus.jpg"                   "cb-cst-portal-apparatus.jpg"
rename_file "cst-ranking-officer-commander-S-hae.jpg"   "cb-cst-ranking-officer-shae.jpg"

# ── SWAT / Blade variants → Cold Brew assault team
rename_file "a-swat.jpg"            "cb-cst-assault-01.jpg"
rename_file "a-swat-blade-.jpg"     "cb-cst-assault-blade.jpg"
rename_file "a-swat-blade-blue.jpg" "cb-cst-assault-blade-blue.jpg"

# ── Glitch witch / siren / oracle characters
rename_file "glitch-witch-orange-ash.jpg"   "cb-cst-glitch-witch.jpg"
rename_file "siren-witch.jpg"               "cb-cst-siren-witch.jpg"
rename_file "siren-witch-rail-mystic.jpg"   "cb-cst-siren-rail-mystic.jpg"

echo ""
echo "▸ ABYSSUM MYSTIC CHARACTERS"
echo "──────────────────────────────────────────────"

# ── a-series character art (base + mystic variants)
rename_file "a1.jpg"        "cb-mystic-a1.jpg"
rename_file "a2.jpg"        "cb-mystic-a2.jpg"
rename_file "a3.jpg"        "cb-mystic-a3.jpg"
rename_file "a4.jpg"        "cb-mystic-a4.jpg"
rename_file "a5.jpg"        "cb-mystic-a5.jpg"
rename_file "a6.jpg"        "cb-mystic-a6.jpg"
rename_file "a7.jpg"        "cb-mystic-a7.jpg"
rename_file "a8.jpg"        "cb-mystic-a8.jpg"
rename_file "a9.jpg"        "cb-mystic-a9.jpg"

rename_file "a1-mystic.jpg"     "cb-mystic-a1-variant.jpg"
rename_file "a2-mystic.jpg"     "cb-mystic-a2-variant.jpg"
rename_file "a3-mystic.jpg"     "cb-mystic-a3-variant.jpg"
rename_file "a4-mystic.jpg"     "cb-mystic-a4-variant.jpg"
rename_file "a5-mystic.jpg"     "cb-mystic-a5-variant.jpg"
rename_file "a6-mystic.jpg"     "cb-mystic-a6-variant.jpg"
rename_file "a6-mysstic.jpg"    "cb-mystic-a6-alt.jpg"
rename_file "a7-mystic.jpg"     "cb-mystic-a7-variant.jpg"

echo ""
echo "▸ ENVIRONMENT / SCENE BACKGROUNDS"
echo "──────────────────────────────────────────────"

rename_file "ancinet-engine-hall.jpg"   "cb-env-engine-hall.jpg"

echo ""
echo "▸ PROPS / ALCHEMY / ARTEFACTS"
echo "──────────────────────────────────────────────"

rename_file "alchemy-board-artefact-3.jpg"  "cb-prop-alchemy-board-3.jpg"
rename_file "alchemy-rare-boards.jpg"       "cb-prop-alchemy-boards-rare.jpg"
rename_file "ash-born-glitch-goblin.jpg"    "cb-prop-glitch-goblin.jpg"
rename_file "ash-forged-kraken-ship.jpg"    "cb-prop-kraken-ship.jpg"
rename_file "battle-mystic-blue-line.jpg"   "cb-prop-battle-mystic-blue.jpg"

# medic/sniper from html_embeds root (used in VS Code earlier)
rename_file "1-medic.webp"  "cb-cst-medic.webp"
rename_file "2-sniper.png"  "cb-cst-sniper.png"

echo ""
echo "▸ LONG-NAME FILES (AI prompt filenames → clean slugs)"
echo "──────────────────────────────────────────────"

# Alchemy boards with UUID names
rename_file "a50222ec-c4ad-4dd0-957b-3f175f78da66.jpg"  "cb-prop-alchemy-board-1.jpg"
rename_file "alchem-board-artefact-2.jpg"               "cb-prop-alchemy-board-2.jpg"
rename_file "alchem-board-rar-artefact.jpg"             "cb-prop-alchemy-board-rare.jpg"
rename_file "alchemist-x.jpg"                           "cb-prop-alchemist-x.jpg"

# Widescreen cinematic / reference art
rename_file "A Widescreen Cinematic Artwork Depicting The Eerie.jpg"   "cb-env-widescreen-eerie.jpg"
rename_file "An Artist's Rendering Of A Man And A Woman Dressed.jpg"   "cb-char-couple-afrofuture.jpg"

echo ""
echo "================================================"
echo "RENAME COMPLETE. Check cb_rename_log.txt for full record."
echo ""
echo "NEXT STEPS:"
echo "  1. Update cold_brew_interactive.html image paths:"
echo "     old: public/images/html_embeds/ancinet-engine-hall.jpg"
echo "     new: public/images/html_embeds/cb-env-engine-hall.jpg"
echo "  2. Run: grep -r 'html_embeds/' ../HTML/src/ to find all references"
echo "  3. Replace old names with new cb-* slugs in all HTML/CSS/JS files"
echo ""
echo "REFERENCE MAP (old → new, key assets for cold_brew_interactive.html):"
echo "  alchemy-rare-boards.jpg        → cb-prop-alchemy-boards-rare.jpg"
echo "  ancinet-engine-hall.jpg        → cb-env-engine-hall.jpg"
echo "  alchemy-board-artefact-3.jpg   → cb-prop-alchemy-board-3.jpg"
echo "  ash-born-glitch-goblin.jpg     → cb-prop-glitch-goblin.jpg"
echo "  ash-forged-kraken-ship.jpg     → cb-prop-kraken-ship.jpg"
echo "  battle-mystic-blue-line.jpg    → cb-prop-battle-mystic-blue.jpg"
echo "  1-medic.webp                   → cb-cst-medic.webp"
echo "  2-sniper.png                   → cb-cst-sniper.png"
echo "  4.jpg                          → cb-cst-pilot-04.jpg"
echo "================================================"
