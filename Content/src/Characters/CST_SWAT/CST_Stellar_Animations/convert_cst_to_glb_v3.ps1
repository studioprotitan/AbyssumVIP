$SrcDir = "E:\AbyssumVIP\Content\src\Characters\CST_SWAT\CST_Stellar_Animations"
$OutDir = "E:\AbyssumVIP\Content\src\Animations"

if (-not (Test-Path $OutDir)) {
    New-Item -ItemType Directory -Path $OutDir | Out-Null
    Write-Host "CREATED $OutDir" -ForegroundColor Green
}

$tool = Get-Command fbx2gltf -ErrorAction SilentlyContinue
if (-not $tool) {
    Write-Host "INSTALLING fbx2gltf..." -ForegroundColor Yellow
    npm install -g fbx2gltf
}

$RenameMap = @{
    "CSTIdle_NonCombat"                         = "idle"
    "CSTellarAS_UE4_MF_Walk_Fwd"               = "walk"
    "CSTellarAS_UE4_MF_Run_Fwd"                = "run"
    "CSTThirdPersonRun"                         = "sprint"
    "CSTGrenade_Jump_Start"                     = "jump_start"
    "CSTGrenade_Jump_Apex"                      = "jump_loop"
    "CSTGrenade_Jump_Land"                      = "jump_land"
    "CST_SlideSlide"                            = "roll"
    "CSTAbility_BazookaFire"                    = "attack_primary"
    "CSTAbility_Grenade_Throw"                  = "attack_secondary"
    "CSTAbility_BazookaEquip_Start"             = "ability_alchemy"
    "CSTAbility_DroneRounds"                    = "ability_golem"
    "CSTVault"                                  = "parkour_vault"
    "CSTWallClimb"                              = "parkour_climb"
    "CST_Climb_Down_Rightanim_Climb_Down_Right" = "parkour_climb_down"
    "CSTStartWallRunLeft"                       = "parkour_wallrun_left"
    "CSTStartWallRunRight"                      = "parkour_wallrun_right"
    "CSTWallRunLeftArms"                        = "parkour_wallrun_left_arms"
    "CSTWallRunRightArms"                       = "parkour_wallrun_right_arms"
    "CSTWallRunUp"                              = "parkour_wallrun_up"
    "CSTLeftWallJump"                           = "parkour_walljump_left"
    "CSTRunningJumpL"                           = "parkour_runjump_left"
    "CSTRunningJumpR"                           = "parkour_runjump_right"
    "CSTLowJump"                                = "parkour_lowjump"
    "CSTMiddleJump"                             = "parkour_midjump"
    "CSTQuickJump"                              = "parkour_quickjump"
    "CSTGrenade_Jump_Fall"                      = "jump_fall"
    "CSTGrenade_Jump_Recovery"                  = "jump_recovery"
}

Write-Host ""
Write-Host "FORGE: Converting $($RenameMap.Count) animations" -ForegroundColor Cyan
Write-Host "  Source: $SrcDir" -ForegroundColor Gray
Write-Host "  Output: $OutDir" -ForegroundColor Gray
Write-Host ""

$success = 0
$failed  = 0
$missing = 0
$skipped = 0

foreach ($entry in $RenameMap.GetEnumerator()) {
    $srcFbx = Join-Path $SrcDir ($entry.Key + ".FBX")
    if (-not (Test-Path $srcFbx)) {
        $srcFbx = Join-Path $SrcDir ($entry.Key + ".fbx")
    }
    $outGlb = Join-Path $OutDir ($entry.Value + ".glb")

    if ((Test-Path $outGlb) -and (Test-Path $srcFbx)) {
        $fbxTime = (Get-Item $srcFbx).LastWriteTime
        $glbTime = (Get-Item $outGlb).LastWriteTime
        if ($glbTime -gt $fbxTime) {
            Write-Host "  SKIP   $($entry.Value).glb  already current" -ForegroundColor DarkGray
            $skipped++
            continue
        }
    }

    if (Test-Path $srcFbx) {
        Write-Host "  CONV   $($entry.Key)" -ForegroundColor White -NoNewline
        $result = & fbx2gltf -i $srcFbx -o $outGlb 2>&1
        if ($LASTEXITCODE -eq 0) {
            $sizeKB = [math]::Round((Get-Item $outGlb).Length / 1KB, 1)
            Write-Host " -> $($entry.Value).glb  $sizeKB KB" -ForegroundColor Green
            $success++
        } else {
            Write-Host " -> FAILED" -ForegroundColor Red
            Write-Host "    $result" -ForegroundColor DarkRed
            $failed++
        }
    } else {
        Write-Host "  MISS   $($entry.Key).FBX" -ForegroundColor Yellow
        $missing++
    }
}

Write-Host ""
Write-Host "----------------------------------------" -ForegroundColor Cyan
Write-Host "  Converted : $success" -ForegroundColor Green
Write-Host "  Skipped   : $skipped" -ForegroundColor DarkGray

if ($missing -gt 0) {
    Write-Host "  Missing   : $missing  <-- check filename" -ForegroundColor Yellow
} else {
    Write-Host "  Missing   : $missing" -ForegroundColor Green
}

if ($failed -gt 0) {
    Write-Host "  Failed    : $failed" -ForegroundColor Red
} else {
    Write-Host "  Failed    : $failed" -ForegroundColor Green
}
Write-Host "----------------------------------------" -ForegroundColor Cyan
Write-Host ""

$coreBindings = @("idle","walk","run","sprint","jump_start","jump_loop","jump_land","roll","attack_primary","attack_secondary","ability_alchemy","ability_golem")

Write-Host "CORE bindings check:" -ForegroundColor White
foreach ($name in $coreBindings) {
    $f = Join-Path $OutDir ($name + ".glb")
    if (Test-Path $f) {
        $kb = [math]::Round((Get-Item $f).Length / 1KB, 1)
        Write-Host "  OK   $name.glb  $kb KB" -ForegroundColor Green
    } else {
        Write-Host "  MISS $name.glb" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "PARKOUR bindings check:" -ForegroundColor White
$parkour = Get-ChildItem -Path $OutDir -Filter "parkour_*.glb" | Sort-Object Name
foreach ($f in $parkour) {
    $kb = [math]::Round($f.Length / 1KB, 1)
    Write-Host "  OK   $($f.Name)  $kb KB" -ForegroundColor DarkCyan
}

Write-Host ""
Write-Host "CONTROLLER READY" -ForegroundColor Green
Write-Host "  E:\AbyssumVIP\Content\src\HTML\GenesisVerse_PlayerController_v1.html" -ForegroundColor White
Write-Host ""
