# ============================================================
# RENAME-GAS-ANIMATIONS-v2.ps1
# Abyssum Pipeline — GAS Animation Normalizer v2
# ============================================================
# Fix 1 — Path: Hardcoded to E:\AbyssumVIP\Content\src\public\gas_animations
# Fix 2 — SK_ Exclusion: Processed before stripping logic
# Fix 3 — Empty Guard: Debug line BaseName → [stripped] → [kebab]
# ============================================================

param(
    [switch]$Execute
)

$DryRun     = -not $Execute
$GASPath    = "E:\AbyssumVIP\Content\src\public\gas_animations"
$LogPath    = Join-Path $GASPath "_rename_log.txt"

# ── Prefixes to strip (longest first to avoid partial matches) ──
$Prefixes = @(
    "CSTellarAS_UE4_MF_",
    "CSTGrenade_",
    "CSTAbility_",
    "CSTAS_",
    "CST_",
    "CST"
)

# ── Files to EXCLUDE from rename (skeleton/mesh assets) ──
$ExcludePatterns = @(
    "^SK_",
    "^SK "
)

# ── Convert PascalCase / Mixed_Case string to kebab-case ──
function ConvertToKebabCase {
    param([string]$Text)
    $r = $Text
    $r = $r -creplace '([a-z])([A-Z])', '$1-$2'
    $r = $r -creplace '([0-9])([A-Z])', '$1-$2'
    $r = $r -creplace '([A-Z]+)([A-Z][a-z])', '$1-$2'
    $r = $r -replace '_', '-'
    $r = $r -replace '-+', '-'
    return $r.Trim('-').ToLower()
}

# ── Resolve collision: if target name exists, append -a, -b, -c … ──
function ResolveCollision {
    param([string]$Dir, [string]$Name, [string]$Ext)
    $candidate = "$Name$Ext"
    if (-not (Test-Path (Join-Path $Dir $candidate))) { return $candidate }
    $suffix = 97  # ASCII 'a'
    do {
        $candidate = "$Name-$([char]$suffix)$Ext"
        $suffix++
    } while (Test-Path (Join-Path $Dir $candidate))
    return $candidate
}

if (-not (Test-Path $GASPath)) {
    Write-Host "[ERROR] GAS path not found: $GASPath" -ForegroundColor Red
    exit 1
}

$files = Get-ChildItem -Path $GASPath -File -Filter "*.fbx"
$log = @()

Write-Host "`n======================================" -ForegroundColor DarkCyan
Write-Host "  GAS ANIMATION NORMALIZER v2" -ForegroundColor Cyan
Write-Host "  Source : $GASPath" -ForegroundColor Gray
Write-Host "  Mode   : $(if ($DryRun) { 'DRY RUN (preview only)' } else { 'EXECUTE' })" -ForegroundColor Yellow
Write-Host "======================================`n" -ForegroundColor DarkCyan

foreach ($file in $files) {
    $baseName = $file.BaseName
    $ext      = $file.Extension

    # Fix 2 — Early Exclusion (Check SK_ before prefix stripping)
    $isExcluded = $false
    foreach ($pattern in $ExcludePatterns) {
        if ($baseName -match $pattern) {
            Write-Host "  SKIP (skeleton) : $($file.Name)" -ForegroundColor DarkGray
            $isExcluded = $true
            break
        }
    }
    if ($isExcluded) { continue }

    # Fix 3 — Conversion Step Debugging
    $stripped = $baseName
    foreach ($prefix in $Prefixes) {
        if ($stripped -imatch "^$([regex]::Escape($prefix))") {
            $stripped = $stripped -ireplace "^$([regex]::Escape($prefix))", ""
            break
        }
    }

    if ([string]::IsNullOrWhiteSpace($stripped)) {
        Write-Host "  SKIP_EMPTY      : $baseName → [stripped result is empty]" -ForegroundColor Red
        continue
    }

    $normalized = ConvertToKebabCase -Input $stripped
    
    # Debug Map Line
    Write-Host "  MAP: $baseName → [$stripped] → [$normalized]" -ForegroundColor Green

    $newBase   = "scene-mint-deploy-$normalized"
    $finalName = ResolveCollision -Dir $GASPath -Name $newBase -Ext $ext

    if ($DryRun) {
        Write-Host "       PREVIEW    : $($file.Name) -> $finalName" -ForegroundColor Cyan
    } else {
        try {
            Rename-Item -Path $file.FullName -NewName $finalName -ErrorAction Stop
            Write-Host "       OK         : $($file.Name) -> $finalName" -ForegroundColor White
            $log += "OK|$($file.Name)|$finalName"
        } catch {
            Write-Host "       ERR        : $($file.Name) | $_" -ForegroundColor Red
            $log += "ERR|$($file.Name)|$_"
        }
    }
}

if (-not $DryRun) {
    $log | Out-File -FilePath $LogPath -Encoding UTF8
    Write-Host "`n  Log written: $LogPath" -ForegroundColor Gray
}

if ($DryRun) {
    Write-Host "`n  Run sequence: .\Rename-GAS-Animations-v2.ps1 -Execute" -ForegroundColor Yellow
}