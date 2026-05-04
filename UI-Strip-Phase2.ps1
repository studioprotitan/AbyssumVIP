# ============================================================
# UI-Strip-Phase2.ps1
# Arenas of Echelon — Remaining Label Compliance Strip
# Phase 8.5 | Simpro Titans Studio, LLC
#
# Phase 1 already completed (via Gemini):
#   SSOT_AUTHORITY  → STATE_CORE         ✅
#   MOAI_BRIDGE     → SYNC_BRIDGE        ✅
#   SENTINEL_DRIFT  → STABILITY_CHECK    ✅
#   GOAP DIRECTIVE  → OPERATIVE_DIRECTIVE✅
#   [GOAP ACTIVE]   → [NODE ACTIVE]      ✅
#
# Phase 2 — this script (remaining tech exposure):
#   BABYLON_ENGINE  → FORGE_ENGINE
#   WEBGL2_CONTEXT  → VISUAL_CORE
#   FORGE_MESH      → AVATAR_MESH
#   ORACLE_NODE     → SYNC_NODE          (right panel cleanup)
#   CALIBRATING BRAIN → SYSTEM CALIBRATING (load screen)
#   ORACLE NODE CONNECTING → CORE SYNC CONNECTING
#
# USAGE:
#   .\UI-Strip-Phase2.ps1                    # dry run
#   .\UI-Strip-Phase2.ps1 -Execute           # live replace
# ============================================================

param([switch]$Execute)

# Target directories — adjust to your project path
$SearchRoots = @(
    "E:\AbyssumVIP\Content\src",
    "C:\Users\Antonio\AbyssumVIP\src"   # fallback if C: drive
)

# File extensions to scan
$Extensions = @("*.tsx", "*.ts", "*.jsx", "*.js", "*.html", "*.css")

# Replacements: ordered from most specific to least
# Format: @("find_exact", "replace_with")
$Replacements = @(
    @("BABYLON_ENGINE",              "FORGE_ENGINE"),
    @("WEBGL2_CONTEXT",              "VISUAL_CORE"),
    @("FORGE_MESH",                  "AVATAR_MESH"),
    @("ORACLE_NODE",                 "SYNC_NODE"),
    @("ORACLE NODE CONNECTING",      "CORE SYNC CONNECTING"),
    @("Oracle Node Connecting",      "Core Sync Connecting"),
    @("CALIBRATING BRAIN",           "SYSTEM CALIBRATING"),
    @("Calibrating Brain",           "System Calibrating"),
    @("oracle-intel-node",           "sync-intel-node"),     # function/import name
    @("getOracleIntel",              "getSyncIntel"),         # function call (code only)
    @("OracleIntel",                 "SyncIntel")            # type name (code only)
)

# NOTE: The last three replacements touch code identifiers, not just UI strings.
# If you want to keep code identifiers intact (recommended for code stability),
# comment out the last 3 entries in $Replacements before executing.
# UI-only safe set ends at "Calibrating Brain" / "System Calibrating".

$DryRun   = -not $Execute
$Changes  = 0
$Scanned  = 0
$Log      = @()

Write-Host ""
Write-Host "======================================" -ForegroundColor DarkCyan
Write-Host "  UI STRIP — PHASE 2" -ForegroundColor Cyan
Write-Host "  Mode: $(if ($DryRun) { 'DRY RUN' } else { 'EXECUTE' })" -ForegroundColor $(if ($DryRun) { 'Yellow' } else { 'Green' })
Write-Host "======================================" -ForegroundColor DarkCyan
Write-Host ""

foreach ($root in $SearchRoots) {
    if (-not (Test-Path $root)) { continue }

    foreach ($ext in $Extensions) {
        $files = Get-ChildItem -Path $root -Filter $ext -Recurse -ErrorAction SilentlyContinue
        foreach ($file in $files) {
            $Scanned++
            $content = Get-Content $file.FullName -Raw -Encoding UTF8
            $original = $content
            $fileChanged = $false

            foreach ($pair in $Replacements) {
                $find    = $pair[0]
                $replace = $pair[1]
                if ($content -cmatch [regex]::Escape($find)) {
                    $count = ([regex]::Matches($content, [regex]::Escape($find))).Count
                    $content = $content -creplace [regex]::Escape($find), $replace
                    Write-Host "  HIT  : $($file.FullName)" -ForegroundColor Cyan
                    Write-Host "         $find → $replace  ($count occurrence$(if ($count -ne 1) { 's' }))" -ForegroundColor DarkCyan
                    $Log += "HIT|$($file.FullName)|$find|$replace|$count"
                    $fileChanged = $true
                    $Changes += $count
                }
            }

            if ($fileChanged -and -not $DryRun) {
                Set-Content -Path $file.FullName -Value $content -Encoding UTF8
            }
        }
    }
}

Write-Host ""
Write-Host "======================================" -ForegroundColor DarkCyan
Write-Host "  Files scanned : $Scanned"
Write-Host "  Replacements  : $Changes"
Write-Host "  Mode          : $(if ($DryRun) { 'DRY RUN — no files changed' } else { 'EXECUTED' })" -ForegroundColor $(if ($DryRun) { 'Yellow' } else { 'Green' })
Write-Host "======================================" -ForegroundColor DarkCyan
Write-Host ""

$Log | Out-File "UI-Strip-Phase2-log.txt" -Encoding UTF8
Write-Host "  Log: .\UI-Strip-Phase2-log.txt" -ForegroundColor DarkGray

if ($DryRun) {
    Write-Host "  To execute: .\UI-Strip-Phase2.ps1 -Execute" -ForegroundColor Yellow
}
