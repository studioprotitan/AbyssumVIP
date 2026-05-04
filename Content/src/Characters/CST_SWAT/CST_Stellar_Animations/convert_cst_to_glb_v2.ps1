# ═══════════════════════════════════════════════════════════════════
# CST Stellar Animations — FBX → GLB Batch Converter v2
# Genesis Verse Player Controller v1.1
# Source: E:\AbyssumVIP\Content\src\Characters\CST_SWAT\CST_Stellar_Animations\
# Output: E:\AbyssumVIP\Content\src\Animations\
# Run from VS Code terminal (PowerShell)
# ═══════════════════════════════════════════════════════════════════

$SrcDir = "E:\AbyssumVIP\Content\src\Characters\CST_SWAT\CST_Stellar_Animations"
$OutDir = "E:\AbyssumVIP\Content\src\Animations"

# ── Create output dir if missing ──────────────────────────────────
if (-not (Test-Path $OutDir)) {
    New-Item -ItemType Directory -Path $OutDir | Out-Null
    Write-Host "[CREATED] $OutDir" -ForegroundColor Green
}

# ── Check fbx2gltf ────────────────────────────────────────────────
Write-Host "`n[SENTINEL] Checking fbx2gltf..." -ForegroundColor Cyan
$tool = Get-Command fbx2gltf -ErrorAction SilentlyContinue
if (-not $tool) {
    Write-Host "[INSTALLING] fbx2gltf..." -ForegroundColor Yellow
    npm install -g fbx2gltf
}

# ═══════════════════════════════════════════════════════════════════
# RENAME MAP — exact FBX name (no extension) → controller GLB name
# Source: confirmed from CST_Stellar_Animations folder screenshots
# ═══════════════════════════════════════════════════════════════════
$RenameMap = @{

    # ── LOCOMOTION ────────────────────────────────────────────────
    "CSTIdle_NonCombat"                    = "idle"
    "CSTellarAS_UE4_MF_Walk_Fwd"          = "walk"
    "CSTellarAS_UE4_MF_Run_Fwd"           = "run"
    "CSTThirdPersonRun"                    = "sprint"

    # ── JUMP SEQUENCE ─────────────────────────────────────────────
    "CSTGrenade_Jump_Start"                = "jump_start"
    "CSTGrenade_Jump_Apex"                 = "jump_loop"
    "CSTGrenade_Jump_Land"                 = "jump_land"

    # ── COMBAT ────────────────────────────────────────────────────
    "CST_SlideSlide"                       = "roll"
    "CSTAbility_BazookaFire"               = "attack_primary"
    "CSTAbility_Grenade_Throw"             = "attack_secondary"

    # ── ABILITIES ─────────────────────────────────────────────────
    "CSTAbility_BazookaEquip_Start"        = "ability_alchemy"
    "CSTAbility_DroneRounds"               = "ability_golem"

    # ── PARKOUR (Phase 8.4 — bonus round) ─────────────────────────
    "CSTVault"                             = "parkour_vault"
    "CSTWallClimb"                         = "parkour_climb"
    "CST_Climb_Down_Rightanim_Climb_Down_Right" = "parkour_climb_down"
    "CSTStartWallRunLeft"                  = "parkour_wallrun_left"
    "CSTStartWallRunRight"                 = "parkour_wallrun_right"
    "CSTWallRunLeftArms"                   = "parkour_wallrun_left_arms"
    "CSTWallRunRightArms"                  = "parkour_wallrun_right_arms"
    "CSTWallRunUp"                         = "parkour_wallrun_up"
    "CSTLeftWallJump"                      = "parkour_walljump_left"
    "CSTRunningJumpL"                      = "parkour_runjump_left"
    "CSTRunningJumpR"                      = "parkour_runjump_right"
    "CSTLowJump"                           = "parkour_lowjump"
    "CSTMiddleJump"                        = "parkour_midjump"
    "CSTQuickJump"                         = "parkour_quickjump"
    "CSTGrenade_Jump_Fall"                 = "jump_fall"
    "CSTGrenade_Jump_Recovery"             = "jump_recovery"
}

# ═══════════════════════════════════════════════════════════════════
# CONVERSION LOOP
# ═══════════════════════════════════════════════════════════════════
Write-Host "`n[FORGE] Converting $($RenameMap.Count) animations..." -ForegroundColor Cyan
Write-Host "  Source : $SrcDir" -ForegroundColor Gray
Write-Host "  Output : $OutDir`n" -ForegroundColor Gray

$success = 0
$failed  = 0
$missing = 0
$skipped = 0

foreach ($entry in $RenameMap.GetEnumerator()) {
    $srcFbx = Join-Path $SrcDir ($entry.Key + ".FBX")
    # Also check lowercase .fbx in case of mixed exports
    if (-not (Test-Path $srcFbx)) {
        $srcFbx = Join-Path $SrcDir ($entry.Key + ".fbx")
    }
    $outGlb = Join-Path $OutDir ($entry.Value + ".glb")

    # Skip if GLB already exists and is newer than FBX
    if ((Test-Path $outGlb) -and (Test-Path $srcFbx)) {
        $fbxTime = (Get-Item $srcFbx).LastWriteTime
        $glbTime = (Get-Item $outGlb).LastWriteTime
        if ($glbTime -gt $fbxTime) {
            Write-Host "  [SKIP]  $($entry.Value).glb  (up to date)" -ForegroundColor DarkGray
            $skipped++
            continue
        }
    }

    if (Test-Path $srcFbx) {
        Write-Host "  [CONV]  $($entry.Key)" -ForegroundColor White -NoNewline
        $result = & fbx2gltf -i $srcFbx -o $outGlb 2>&1
        if ($LASTEXITCODE -eq 0) {
            $sizeKB = [math]::Round((Get-Item $outGlb).Length / 1KB, 1)
            Write-Host " → $($entry.Value).glb  ($sizeKB KB)" -ForegroundColor Green
            $success++
        } else {
            Write-Host " → FAILED" -ForegroundColor Red
            Write-Host "    $result" -ForegroundColor DarkRed
            $failed++
        }
    } else {
        Write-Host "  [MISS]  $($entry.Key).FBX" -ForegroundColor Yellow
        $missing++
    }
}

# ═══════════════════════════════════════════════════════════════════
# REPORT
# ═══════════════════════════════════════════════════════════════════
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  [SENTINEL] Conversion Report" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  Converted : $success" -ForegroundColor Green
Write-Host "  Skipped   : $skipped  (already current)" -ForegroundColor DarkGray
Write-Host "  Missing   : $missing  (check FBX filename)" -ForegroundColor $(if ($missing -gt 0) {"Yellow"} else {"Green"})
Write-Host "  Failed    : $failed" -ForegroundColor $(if ($failed -gt 0) {"Red"} else {"Green"})
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

# List all GLBs produced
Write-Host "[FORGE] GLB manifest — $OutDir :" -ForegroundColor Cyan
$glbs = Get-ChildItem -Path $OutDir -Filter "*.glb" | Sort-Object Name
$coreBindings   = @("idle","walk","run","sprint","jump_start","jump_loop","jump_land","roll","attack_primary","attack_secondary","ability_alchemy","ability_golem")
$parkourBindings = $glbs | Where-Object { $_.BaseName -like "parkour_*" }

Write-Host "`n  CORE (12 controller bindings):" -ForegroundColor White
foreach ($name in $coreBindings) {
    $f = Join-Path $OutDir ($name + ".glb")
    if (Test-Path $f) {
        $kb = [math]::Round((Get-Item $f).Length / 1KB, 1)
        Write-Host "  [OK] $name.glb  ($kb KB)" -ForegroundColor Green
    } else {
        Write-Host "  [--] $name.glb  MISSING" -ForegroundColor Red
    }
}

Write-Host "`n  PARKOUR (Phase 8.4):" -ForegroundColor White
foreach ($f in $parkourBindings) {
    $kb = [math]::Round($f.Length / 1KB, 1)
    Write-Host "  [OK] $($f.Name)  ($kb KB)" -ForegroundColor DarkCyan
}

Write-Host "`n[CONTROLLER] Ready." -ForegroundColor Green
Write-Host "  Open: E:\AbyssumVIP\Content\src\HTML\GenesisVerse_PlayerController_v1.html`n" -ForegroundColor White
