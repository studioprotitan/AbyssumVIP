# ============================================================
# RENAME-GAS-ANIMATIONS-v3.ps1
# Abyssum Pipeline - GAS Animation Normalizer
# Commander: Antonio | Simpro Titans Studio, LLC
# ============================================================
# USAGE:
#   Dry run:  .\Rename-GAS-Animations-v3.ps1
#   Execute:  .\Rename-GAS-Animations-v3.ps1 -Execute
# ============================================================

param(
    [switch]$Execute
)

$DryRun  = -not $Execute
$GASPath = "E:\AbyssumVIP\Content\src\public\gas_animations"
$LogPath = "E:\AbyssumVIP\Content\src\public\gas_animations\_rename_log.txt"

# Prefixes to strip - longest first, order matters
$Prefixes = @(
    "CSTellarAS_UE4_MF_",
    "CSTGrenade_",
    "CSTAbility_",
    "CST_Bazooka_",
    "CSTBazooka_",
    "CSTAS_",
    "CST_",
    "CST"
)

# Skeleton/mesh files to never rename
$ExcludePatterns = @(
    "^SK_",
    "^SK "
)

# Manual decode table for cryptic abbreviations
# CC=CrouchCrouch CD=CrouchDown CL=CrouchLeft CR=CrouchRight CU=CrouchUp
# _B=Backward variant _D=Down variant _U=Up variant
$AbbrevMap = @{
    "CC"       = "crouch-crouch"
    "CC_NOADD" = "crouch-crouch-no-additive"
    "CC_NOADD1"= "crouch-crouch-no-additive-1"
    "CD"       = "crouch-down"
    "CL"       = "crouch-left"
    "CL_B"     = "crouch-left-back"
    "CLD"      = "crouch-left-down"
    "CLD_B"    = "crouch-left-down-back"
    "CLU"      = "crouch-left-up"
    "CLU_B"    = "crouch-left-up-back"
    "CR"       = "crouch-right"
    "CR_B"     = "crouch-right-back"
    "CRD"      = "crouch-right-down"
    "CRD_B"    = "crouch-right-down-back"
    "CRU"      = "crouch-right-up"
    "CRU_B"    = "crouch-right-up-back"
    "CU"       = "crouch-up"
    "Braced_DropBracedDrop"           = "braced-drop"
    "CastCast"                       = "cast"
    "Jump_EndThirdPersonJump_End"     = "jump-end"
    "Jump_LoopThirdPersonJump_Loop"   = "jump-loop"
    "Jump_StartThirdPersonJump_Start" = "jump-start"
    "LeftWall_JumpLeftWallJump"       = "left-wall-jump"
    "Slide_RSlide_Right"             = "slide-right"
    "SlideSlide"                     = "slide"
    "CSTellarAS_UE4_MF_Idle"         = "idle-stellar"
}

function ConvertToKebabCase {
    param([string]$str)
    $str = [regex]::Replace($str, '([a-z])([A-Z])', '$1-$2')
    $str = [regex]::Replace($str, '([0-9])([A-Z])', '$1-$2')
    $str = [regex]::Replace($str, '([A-Z]{2,})([A-Z][a-z])', '$1-$2')
    $str = $str.Replace('_', '-')
    $str = [regex]::Replace($str, '-{2,}', '-')
    $str = $str.Trim('-')
    return $str.ToLower()
}

function ResolveCollision {
    param([string]$Dir, [string]$Name, [string]$Ext)
    $candidate = "$Name$Ext"
    if (-not (Test-Path (Join-Path $Dir $candidate))) { return $candidate }
    $suffix = 97
    do {
        $candidate = "$Name-$([char]$suffix)$Ext"
        $suffix++
    } while (Test-Path (Join-Path $Dir $candidate))
    return $candidate
}

# ============================================================
# VALIDATION
# ============================================================

if (-not (Test-Path $GASPath)) {
    Write-Host "[ERROR] Path not found: $GASPath" -ForegroundColor Red
    exit 1
}

$files      = Get-ChildItem -Path $GASPath -File
$total      = $files.Count
$renamed    = 0
$skipped    = 0
$collisions = 0
$errors     = 0
$log        = @()

Write-Host ""
Write-Host "============================================" -ForegroundColor DarkCyan
Write-Host "  GAS ANIMATION NORMALIZER v3" -ForegroundColor Cyan
Write-Host "  Path  : $GASPath" -ForegroundColor Gray
Write-Host "  Files : $total" -ForegroundColor Gray
if ($DryRun) {
    Write-Host "  Mode  : DRY RUN - no changes" -ForegroundColor Yellow
} else {
    Write-Host "  Mode  : EXECUTE - renaming files" -ForegroundColor Green
}
Write-Host "============================================" -ForegroundColor DarkCyan
Write-Host ""

# ============================================================
# MAIN LOOP
# ============================================================

foreach ($file in $files) {

    $baseName = $file.BaseName
    $ext      = $file.Extension

    # STEP 1 - Skip log file
    if ($file.Name -eq "_rename_log.txt") {
        continue
    }

    # STEP 2 - Exclude SK_ skeleton files
    $excluded = $false
    foreach ($pattern in $ExcludePatterns) {
        if ($baseName -match $pattern) {
            Write-Host "  SKIP (skeleton) : $($file.Name)" -ForegroundColor DarkGray
            $log += "SKIP_SKELETON|$($file.Name)"
            $skipped++
            $excluded = $true
            break
        }
    }
    if ($excluded) { continue }

    # STEP 3 - Strip prefix
    $stripped = $baseName
    foreach ($prefix in $Prefixes) {
        if ($stripped -imatch "^$([regex]::Escape($prefix))") {
            $stripped = $stripped -ireplace "^$([regex]::Escape($prefix))", ""
            break
        }
    }

    # STEP 4 - Guard against empty strip result
    if ([string]::IsNullOrWhiteSpace($stripped)) {
        Write-Host "  SKIP (empty)    : $($file.Name)" -ForegroundColor Yellow
        $log += "SKIP_EMPTY|$($file.Name)"
        $skipped++
        continue
    }

        # STEP 5 - Check abbreviation map (post-strip), then kebab convert
        if ($AbbrevMap.ContainsKey($stripped)) {
            $kebab = $AbbrevMap[$stripped]
            Write-Host "  MAP (abbrev) : $baseName -> [$stripped] -> [$kebab]" -ForegroundColor Cyan
        } else {
            $kebab = ConvertToKebabCase $stripped
            Write-Host "  MAP          : $baseName -> [$stripped] -> [$kebab]" -ForegroundColor DarkGray
        }

    # STEP 6 - Guard against empty kebab result
    if ([string]::IsNullOrWhiteSpace($kebab)) {
        Write-Host "  SKIP (kebab empty) : $($file.Name) | stripped=[$stripped]" -ForegroundColor Red
        $log += "SKIP_KEBAB_EMPTY|$($file.Name)|stripped=$stripped"
        $skipped++
        continue
    }

    # STEP 7 - Build final name
    $newBase   = "scene-mint-deploy-$kebab"
    $finalName = ResolveCollision -Dir $GASPath -Name $newBase -Ext $ext

    if ($finalName -ne "$newBase$ext") {
        Write-Host "  COLLISION : $($file.Name) -> $finalName" -ForegroundColor Magenta
        $log += "COLLISION|$($file.Name)|$finalName"
        $collisions++
    }

    # STEP 8 - Rename or preview
    if ($DryRun) {
        Write-Host "  PREVIEW  : $($file.Name)" -ForegroundColor DarkYellow
        Write-Host "          -> $finalName" -ForegroundColor Cyan
        $log += "PREVIEW|$($file.Name)|$finalName"
    } else {
        try {
            Rename-Item -Path $file.FullName -NewName $finalName -ErrorAction Stop
            Write-Host "  OK : $($file.Name) -> $finalName" -ForegroundColor Green
            $log += "OK|$($file.Name)|$finalName"
            $renamed++
        } catch {
            Write-Host "  ERR : $($file.Name) | $_" -ForegroundColor Red
            $log += "ERR|$($file.Name)|$_"
            $errors++
        }
    }
}

# ============================================================
# SUMMARY
# ============================================================

Write-Host ""
Write-Host "============================================" -ForegroundColor DarkCyan
Write-Host "  SUMMARY" -ForegroundColor Cyan
Write-Host "  Total      : $total"      -ForegroundColor Gray
Write-Host "  Renamed    : $renamed"    -ForegroundColor Green
Write-Host "  Skipped    : $skipped"    -ForegroundColor DarkGray
Write-Host "  Collisions : $collisions" -ForegroundColor Magenta
Write-Host "  Errors     : $errors"     -ForegroundColor $(if ($errors -gt 0) { 'Red' } else { 'Gray' })
Write-Host "============================================" -ForegroundColor DarkCyan
Write-Host ""

$log | Out-File -FilePath $LogPath -Encoding ASCII
Write-Host "  Log: $LogPath" -ForegroundColor DarkGray
Write-Host ""

if ($DryRun) {
    Write-Host "  Preview clean? Run: .\Rename-GAS-Animations-v3.ps1 -Execute" -ForegroundColor Yellow
    Write-Host "  Any SKIP lines above need manual review before executing." -ForegroundColor Yellow
}
Write-Host ""
