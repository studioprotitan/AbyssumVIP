# ══════════════════════════════════════════════════════════════
#  APPLY_GEMINI_PATCH.ps1
#  Applies Gemini's correct inline style fix to cold_brew_interactive.html
#  Run from E:\AbyssumVIP\Content
#
#  What this fixes:
#    Lines 906, 911, 916, 921 — removes style="width:X%" from HUD bar divs
#    Line 1003 area — changes style.width = to CSS custom properties
#    Adds :root CSS custom properties for the four HUD bars
#
#  USAGE:
#    .\APPLY_GEMINI_PATCH.ps1           # dry run
#    .\APPLY_GEMINI_PATCH.ps1 -Apply    # execute
# ══════════════════════════════════════════════════════════════

param([switch]$Apply)

$RootDir = "E:\AbyssumVIP\Content\src\HTML"
Write-Host ""
Write-Host "═══════════════════════════════════════════" -ForegroundColor Magenta
Write-Host " APPLY GEMINI PATCH — PROJECT WIDE" -ForegroundColor Magenta
Write-Host " DRY RUN: $(-not $Apply)" -ForegroundColor Magenta
Write-Host "═══════════════════════════════════════════" -ForegroundColor Magenta
Write-Host ""

if (-not (Test-Path $RootDir)) {
    Write-Host "[ERROR] Root dir not found: $RootDir" -ForegroundColor Red
    exit 1
}

$Files = Get-ChildItem -Path $RootDir -Filter *.html -Recurse
$TotalFixed = 0

foreach ($FileItem in $Files) {
    $FILE = $FileItem.FullName
    $content = Get-Content $FILE -Raw -Encoding UTF8
    $isModified = $false

    # ── PATCH 1: Add CSS custom properties to :root ──────────────
    $rootInsert = @"
  :root {
    --hud-flood-width: 20%;
    --hud-alert-width: 0%;
    --hud-oracle-width: 70%;
    --hud-progress-width: 0%;
  }
"@

    if ($content -match ':root' -and -not ($content -match '--hud-flood-width')) {
        $content = $content -replace '(:root\s*\{[^}]+\})', "`$1`n$rootInsert"
        # Only mark modified if we actually found a place to put it
        if ($content -match '--hud-flood-width') { $isModified = $true }
    }

    # ── PATCH 2: Add width rules for HUD bars ───────────────────
    $barCSSFind    = 'transition: width 0.6s ease;'
    $barCSSReplace = @"
    transition: width 0.6s ease;
  }

  #bar-flood    { width: var(--hud-flood-width); }
  #bar-alert    { width: var(--hud-alert-width); }
  #bar-oracle   { width: var(--hud-oracle-width); }
  #bar-progress { width: var(--hud-progress-width);
"@

    if ($content -match $barCSSFind -and -not ($content -match '#bar-flood\s*\{')) {
        $content = $content.Replace($barCSSFind, $barCSSReplace)
        $isModified = $true
    }

    # ── PATCH 3: Remove inline styles from HTML elements ────────
    $patches = @(
    @{ find = 'id="bar-flood" style="width:20%"';   replace = 'id="bar-flood"' },
    @{ find = "id='bar-flood' style='width:20%'";   replace = "id='bar-flood'" },
    @{ find = 'id="bar-alert" style="width:0%"';    replace = 'id="bar-alert"' },
    @{ find = "id='bar-alert' style='width:0%'";    replace = "id='bar-alert'" },
    @{ find = 'id="bar-oracle" style="width:70%"';  replace = 'id="bar-oracle"' },
    @{ find = "id='bar-oracle' style='width:70%'";  replace = "id='bar-oracle'" },
    @{ find = 'id="bar-progress" style="width:0%"'; replace = 'id="bar-progress"' },
    @{ find = "id='bar-progress' style='width:0%'"; replace = "id='bar-progress'" }
)

    foreach ($p in $patches) {
        if ($content -match [regex]::Escape($p.find)) {
            $content = $content.Replace($p.find, $p.replace)
            $isModified = $true
        }
    }

    # ── PATCH 4: Replace JS style.width with CSS custom properties
    $jsOld = @"
  document.getElementById('bar-flood').style.width    = Math.min(s.floodingLevel * 20, 100) + '%';
  document.getElementById('bar-alert').style.width    = Math.min(s.enemyAlert * 10, 100) + '%';
  document.getElementById('bar-oracle').style.width   = Math.min(s.oracleConfidence, 100) + '%';
  document.getElementById('bar-progress').style.width = Math.min(s.missionProgress, 100) + '%';
"@

    $jsNew = @"
  document.documentElement.style.setProperty('--hud-flood-width',    Math.min(s.floodingLevel * 20, 100) + '%');
  document.documentElement.style.setProperty('--hud-alert-width',    Math.min(s.enemyAlert * 10, 100) + '%');
  document.documentElement.style.setProperty('--hud-oracle-width',   Math.min(s.oracleConfidence, 100) + '%');
  document.documentElement.style.setProperty('--hud-progress-width', Math.min(s.missionProgress, 100) + '%');
"@

    if ($content -match "bar-flood.*style\.width" -and -not ($content -match '--hud-flood-width.*setProperty')) {
        if ($content.Contains($jsOld.Trim())) {
            $content = $content.Replace($jsOld.Trim(), $jsNew.Trim())
            $isModified = $true
        }
    }

    # ── APPLY OR REPORT ──────────────────────────────────────────
    if ($isModified) {
        Write-Host "  [FIX] $($FileItem.Name)" -ForegroundColor Green
        if ($Apply) {
            $backup = $FILE + ".bak"
            Copy-Item $FILE $backup -Force
            Set-Content $FILE $content -Encoding UTF8 -NoNewline
            $TotalFixed++
        } else {
            Write-Host "        (Run with -Apply to save)" -ForegroundColor Gray
        }
    }
}

Write-Host ""
Write-Host "SCAN COMPLETE. Files fixed: $TotalFixed" -ForegroundColor Cyan
