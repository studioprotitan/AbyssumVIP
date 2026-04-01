<#
.SYNOPSIS
    Renames and standardizes image assets for the Abyssum project.

.DESCRIPTION
    This script renames every file in the target directory (SourceDir) to a clean,
    standardized 'cb-*' slug. It's designed to be run from the folder containing the images.

    - All filenames are converted to lowercase, hyphenated slugs.
    - Files are grouped by faction/role (cb-cst-*, cb-mystic-*, etc.).
    - Preserves original file extensions (.jpg, .png, .webp).
    - Creates a detailed log file (cb_rename_log.ps1.txt).
    - By default, runs in a dry-run mode, showing what would change. Use the -Apply switch to perform the renames.

.PARAMETER SourceDir
    The full path to the directory containing the images to rename.
    Example: "E:\AbyssumVIP\Content\src\HTML\public\html_embeds"

.PARAMETER Apply
    A switch parameter. If present, the script will perform the file renames.
    If omitted, the script will only perform a dry run and report what it would do.

.EXAMPLE
    # Perform a dry run (shows what would be renamed in cyan)
    .\Rename-AbyssumImages.ps1 -SourceDir "E:\AbyssumVIP\Content\src\HTML\public\html_embeds"

.EXAMPLE
    # Apply the renames for real
    .\Rename-AbyssumImages.ps1 -SourceDir "E:\AbyssumVIP\Content\src\HTML\public\html_embeds" -Apply
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory=$true, HelpMessage="Path to the image directory.")]
    [string]$SourceDir,

    [Parameter(HelpMessage="Switch to apply changes. Default is a dry run.")]
    [switch]$Apply
)

# --- Configuration ---
$LogFile = Join-Path -Path $SourceDir -ChildPath "cb_rename_log.ps1.txt"
$IsDryRun = -not $Apply.IsPresent

# --- Initialize Log File ---
$LogHeader = "ABYSSUM — MASTER RENAME LOG — $(Get-Date)"
$LogHeader | Set-Content -Path $LogFile
("=" * 50) | Add-Content -Path $LogFile

# --- Helper Function ---
function Rename-AbyssumImage {
    param(
        [string]$OldName,
        [string]$NewName
    )

    $OldPath = Join-Path -Path $SourceDir -ChildPath $OldName

    if (Test-Path -Path $OldPath -PathType Leaf) {
        if ($IsDryRun) {
            $Message = "[WOULD RENAME] $OldName -> $NewName"
            Write-Host $Message -ForegroundColor Cyan
            $Message | Add-Content -Path $LogFile
        } else {
            try {
                Rename-Item -Path $OldPath -NewName $NewName -ErrorAction Stop
                $Message = "[RENAMED] $OldName -> $NewName"
                Write-Host $Message -ForegroundColor Green
                $Message | Add-Content -Path $LogFile
            } catch {
                $ErrorMessage = "[ERROR] Failed to rename $OldName to $NewName. Reason: $($_.Exception.Message)"
                Write-Host $ErrorMessage -ForegroundColor Red
                $ErrorMessage | Add-Content -Path $LogFile
            }
        }
    } else {
        $Message = "[SKIP — not found] $OldName"
        $Message | Add-Content -Path $LogFile
    }
}

# --- Main Execution ---
Write-Host ""
if ($IsDryRun) {
    Write-Host "Performing DRY RUN. No files will be changed. Use -Apply to execute." -ForegroundColor Yellow
} else {
    Write-Host "APPLYING changes. Files will be renamed." -ForegroundColor Yellow
}
Write-Host ("=" * 50)

Write-Host ""
Write-Host "▸ CST OPERATIVE CHARACTERS"
Write-Host ("-" * 46)

# -- Numbered character sheets (1–8) -> cold-brew-pilot series
Rename-AbyssumImage -OldName "1.jpg"   -NewName "cb-cst-pilot-01.jpg"
Rename-AbyssumImage -OldName "2.jpg"   -NewName "cb-cst-pilot-02.jpg"
Rename-AbyssumImage -OldName "3.jpg"   -NewName "cb-cst-pilot-03.jpg"
Rename-AbyssumImage -OldName "4.jpg"   -NewName "cb-cst-pilot-04.jpg"
Rename-AbyssumImage -OldName "5.jpg"   -NewName "cb-cst-pilot-05.jpg"
Rename-AbyssumImage -OldName "6.jpg"   -NewName "cb-cst-pilot-06.jpg"
Rename-AbyssumImage -OldName "7.jpg"   -NewName "cb-cst-pilot-07.jpg"
Rename-AbyssumImage -OldName "8.jpg"   -NewName "cb-cst-pilot-08.jpg"

# -- Named CST operatives
Rename-AbyssumImage -OldName "cold-brew-mission-commander.jpg"           -NewName "cb-cst-commander.jpg"
Rename-AbyssumImage -OldName "cst-medic.jpg"                             -NewName "cb-cst-medic.jpg"
Rename-AbyssumImage -OldName "cst-sniper.jpg"                            -NewName "cb-cst-sniper.jpg"
Rename-AbyssumImage -OldName "cst-witch.jpg"                             -NewName "cb-cst-witch.jpg"
Rename-AbyssumImage -OldName "cst-undercity.jpg"                         -NewName "cb-cst-undercity.jpg"
Rename-AbyssumImage -OldName "cst-pilot-officer.jpg"                     -NewName "cb-cst-pilot-officer.jpg"
Rename-AbyssumImage -OldName "cst-patrol-officer.jpg"                    -NewName "cb-cst-patrol-officer.jpg"
Rename-AbyssumImage -OldName "cst-patrol-officer-male.jpg"               -NewName "cb-cst-patrol-officer-male.jpg"
Rename-AbyssumImage -OldName "cst-patrol-mpc.jpg"                        -NewName "cb-cst-patrol-mpc.jpg"
Rename-AbyssumImage -OldName "cst-patrol-mpc-station-commander.jpg"      -NewName "cb-cst-patrol-station-cmdr.jpg"
Rename-AbyssumImage -OldName "cst-patrol-glitch-squad.jpg"               -NewName "cb-cst-patrol-glitch-squad.jpg"
Rename-AbyssumImage -OldName "cst-patrol-swamp-rail.jpg"                 -NewName "cb-cst-patrol-swamp-rail.jpg"
Rename-AbyssumImage -OldName "cst-cargo-yards.jpg"                       -NewName "cb-cst-cargo-yards.jpg"
Rename-AbyssumImage -OldName "cst-sewer-city-patrol-witch.jpg"           -NewName "cb-cst-sewer-patrol-witch.jpg"
Rename-AbyssumImage -OldName "cst-station-manager.jpg"                   -NewName "cb-cst-station-manager.jpg"
Rename-AbyssumImage -OldName "cst-train-and-rail-heavy-armor.jpg"        -NewName "cb-cst-train-rail-heavy.jpg"
Rename-AbyssumImage -OldName "cst-train-engineer.jpg"                    -NewName "cb-cst-train-engineer.jpg"
Rename-AbyssumImage -OldName "cst-train-escort.jpg"                      -NewName "cb-cst-train-escort.jpg"
Rename-AbyssumImage -OldName "cst-portal-aparatus.jpg"                   -NewName "cb-cst-portal-apparatus.jpg"
Rename-AbyssumImage -OldName "cst-ranking-officer-commander-S-hae.jpg"   -NewName "cb-cst-ranking-officer-shae.jpg"

# -- SWAT / Blade variants -> Cold Brew assault team
Rename-AbyssumImage -OldName "a-swat.jpg"            -NewName "cb-cst-assault-01.jpg"
Rename-AbyssumImage -OldName "a-swat-blade-.jpg"     -NewName "cb-cst-assault-blade.jpg"
Rename-AbyssumImage -OldName "a-swat-blade-blue.jpg" -NewName "cb-cst-assault-blade-blue.jpg"

# -- Glitch witch / siren / oracle characters
Rename-AbyssumImage -OldName "glitch-witch-orange-ash.jpg"   -NewName "cb-cst-glitch-witch.jpg"
Rename-AbyssumImage -OldName "siren-witch.jpg"               -NewName "cb-cst-siren-witch.jpg"
Rename-AbyssumImage -OldName "siren-witch-rail-mystic.jpg"   -NewName "cb-cst-siren-rail-mystic.jpg"

Write-Host ""
Write-Host "▸ ABYSSUM MYSTIC CHARACTERS"
Write-Host ("-" * 46)

# -- a-series character art (base + mystic variants)
Rename-AbyssumImage -OldName "a1.jpg" -NewName "cb-mystic-a1.jpg"
Rename-AbyssumImage -OldName "a2.jpg" -NewName "cb-mystic-a2.jpg"
Rename-AbyssumImage -OldName "a3.jpg" -NewName "cb-mystic-a3.jpg"
Rename-AbyssumImage -OldName "a4.jpg" -NewName "cb-mystic-a4.jpg"
Rename-AbyssumImage -OldName "a5.jpg" -NewName "cb-mystic-a5.jpg"
Rename-AbyssumImage -OldName "a6.jpg" -NewName "cb-mystic-a6.jpg"
Rename-AbyssumImage -OldName "a7.jpg" -NewName "cb-mystic-a7.jpg"
Rename-AbyssumImage -OldName "a8.jpg" -NewName "cb-mystic-a8.jpg"
Rename-AbyssumImage -OldName "a9.jpg" -NewName "cb-mystic-a9.jpg"
Rename-AbyssumImage -OldName "a1-mystic.jpg"  -NewName "cb-mystic-a1-variant.jpg"
Rename-AbyssumImage -OldName "a2-mystic.jpg"  -NewName "cb-mystic-a2-variant.jpg"
Rename-AbyssumImage -OldName "a3-mystic.jpg"  -NewName "cb-mystic-a3-variant.jpg"
Rename-AbyssumImage -OldName "a4-mystic.jpg"  -NewName "cb-mystic-a4-variant.jpg"
Rename-AbyssumImage -OldName "a5-mystic.jpg"  -NewName "cb-mystic-a5-variant.jpg"
Rename-AbyssumImage -OldName "a6-mystic.jpg"  -NewName "cb-mystic-a6-variant.jpg"
Rename-AbyssumImage -OldName "a6-mysstic.jpg" -NewName "cb-mystic-a6-alt.jpg"
Rename-AbyssumImage -OldName "a7-mystic.jpg"  -NewName "cb-mystic-a7-variant.jpg"

Write-Host ""
Write-Host "▸ ENVIRONMENT / SCENE BACKGROUNDS"
Write-Host ("-" * 46)

Rename-AbyssumImage -OldName "ancinet-engine-hall.jpg" -NewName "cb-env-engine-hall.jpg"

Write-Host ""
Write-Host "▸ PROPS / ALCHEMY / ARTEFACTS"
Write-Host ("-" * 46)

Rename-AbyssumImage -OldName "alchemy-board-artefact-3.jpg" -NewName "cb-prop-alchemy-board-3.jpg"
Rename-AbyssumImage -OldName "alchemy-rare-boards.jpg"      -NewName "cb-prop-alchemy-boards-rare.jpg"
Rename-AbyssumImage -OldName "ash-born-glitch-goblin.jpg"   -NewName "cb-prop-glitch-goblin.jpg"
Rename-AbyssumImage -OldName "ash-forged-kraken-ship.jpg"   -NewName "cb-prop-kraken-ship.jpg"
Rename-AbyssumImage -OldName "battle-mystic-blue-line.jpg"  -NewName "cb-prop-battle-mystic-blue.jpg"

# medic/sniper from html_embeds root (used in VS Code earlier)
Rename-AbyssumImage -OldName "1-medic.webp" -NewName "cb-cst-medic.webp"
Rename-AbyssumImage -OldName "2-sniper.png" -NewName "cb-cst-sniper.png"

Write-Host ""
Write-Host "▸ LONG-NAME FILES (AI prompt filenames -> clean slugs)"
Write-Host ("-" * 46)

# Alchemy boards with UUID names
Rename-AbyssumImage -OldName "a50222ec-c4ad-4dd0-957b-3f175f78da66.jpg" -NewName "cb-prop-alchemy-board-1.jpg"
Rename-AbyssumImage -OldName "alchem-board-artefact-2.jpg"              -NewName "cb-prop-alchemy-board-2.jpg"
Rename-AbyssumImage -OldName "alchem-board-rar-artefact.jpg"            -NewName "cb-prop-alchemy-board-rare.jpg"
Rename-AbyssumImage -OldName "alchemist-x.jpg"                          -NewName "cb-prop-alchemist-x.jpg"

# Widescreen cinematic / reference art
Rename-AbyssumImage -OldName "A Widescreen Cinematic Artwork Depicting The Eerie.jpg" -NewName "cb-env-widescreen-eerie.jpg"
Rename-AbyssumImage -OldName "An Artist's Rendering Of A Man And A Woman Dressed.jpg" -NewName "cb-char-couple-afrofuture.jpg"

Write-Host ""
Write-Host ("=" * 50)
if ($IsDryRun) {
    Write-Host "DRY RUN COMPLETE. No files were changed." -ForegroundColor Green
} else {
    Write-Host "RENAME COMPLETE." -ForegroundColor Green
}
Write-Host "Check '$LogFile' for a full record."
Write-Host ("=" * 50)

Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Yellow
Write-Host "  1. Update any HTML/CSS/JS files that reference the old image paths."
Write-Host "  2. You can use a tool like 'grep' or VS Code's search to find all references."
Write-Host ""
Write-Host "REFERENCE MAP (old → new, key assets):"
Write-Host "  alchemy-rare-boards.jpg        → cb-prop-alchemy-boards-rare.jpg"
Write-Host "  ancinet-engine-hall.jpg        → cb-env-engine-hall.jpg"
Write-Host "  1-medic.webp                   → cb-cst-medic.webp"
Write-Host "  2-sniper.png                   → cb-cst-sniper.png"
Write-Host "  4.jpg                          → cb-cst-pilot-04.jpg"
Write-Host ("=" * 50)