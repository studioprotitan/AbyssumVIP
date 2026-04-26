<#
.SYNOPSIS
    Batch converts textures to WebP using ImageMagick for the StellarWoman pipeline.
    Drastically reduces file size (approx 90%) while preserving PBR fidelity.

.DESCRIPTION
    - Identifies Normal maps (lossless conversion).
    - Compresses Albedo/RMA/Emissive maps (lossy Q80).
    - Resizes to max 2048x2048 (downscale only).
    - Output: ./optimized folder.

.USAGE
    .\Optimize-Textures.ps1
#>

param(
    [string]$TargetDir = "E:\AbyssumVIP\Content\src\Characters\StellarWoman"
)

# 1. Dependency Check
if (-not (Get-Command "magick" -ErrorAction SilentlyContinue)) {
    Write-Host "Error: ImageMagick is not installed or not in PATH." -ForegroundColor Red
    Write-Host "Download: https://imagemagick.org/script/download.php#windows"
    Write-Host "Ensure 'Add to PATH' is checked during install."
    exit 1
}

# 2. Validate Path
if (-not (Test-Path $TargetDir)) {
    Write-Host "Target directory not found: $TargetDir" -ForegroundColor Red
    exit 1
}

# 3. Prepare Output
$OutputFolder = Join-Path -Path $TargetDir -ChildPath "optimized"
if (-not (Test-Path -Path $OutputFolder)) {
    New-Item -ItemType Directory -Force -Path $OutputFolder | Out-Null
}

Write-Host "=========================================" -ForegroundColor Magenta
Write-Host " STELLAR WOMAN TEXTURE OPTIMIZER" -ForegroundColor Magenta
Write-Host " Target: $TargetDir" -ForegroundColor Gray
Write-Host "========================================="

# 4. Processing Loop
$Images = Get-ChildItem -Path $TargetDir -Include *.png, *.jpg, *.jpeg, *.tga -Recurse -File | 
          Where-Object { $_.DirectoryName -ne $OutputFolder }

foreach ($img in $Images) {
    $InputPath  = $img.FullName
    $BaseName   = $img.BaseName
    $Ext        = $img.Extension
    $OutputPath = Join-Path -Path $OutputFolder -ChildPath "$BaseName.webp"

    # Skip if optimized version is already up-to-date
    if (Test-Path $OutputPath) {
        if ((Get-Item $InputPath).LastWriteTime -le (Get-Item $OutputPath).LastWriteTime) {
            Write-Host "[SKIPPED]  $BaseName$Ext (Already Optimized)" -ForegroundColor Gray
            continue
        }
    }

    # Detect Normal Maps (nrm, norm, normal, _n)
    $IsNormal = $BaseName -match "normal|nrm|norm|_n$"

    if ($IsNormal) {
        # LOSSLESS: Preserves geometry normals perfectly
        # "2048x2048>" means resize ONLY if width/height > 2048
        magick "$InputPath" -resize "2048x2048>" -define webp:lossless=true "$OutputPath"
        Write-Host "[NORMAL]   $BaseName$Ext -> Lossless WebP" -ForegroundColor Cyan
    } else {
        # LOSSY (Q80): High fidelity compression for colors
        magick "$InputPath" -resize "2048x2048>" -quality 80 "$OutputPath"
        Write-Host "[TEXTURE]  $BaseName$Ext -> WebP (Q80)" -ForegroundColor Green
    }
}

Write-Host "========================================="
Write-Host "DONE. Optimized textures in: $OutputFolder" -ForegroundColor Yellow
Write-Host "========================================="