"""
================================================
usd_to_glb.py
Abyssum Pipeline - Kitbash3D USD to GLB Converter
Kit: kb3d_ironforge
Source: E:\\Cargo\\kb3d_ironforge\\Models
Output: E:\\AbyssumVIP\\Content\\src\\public\\models
Commander: Antonio | Simpro Titans Studio, LLC
================================================
USAGE:
    Dry run (preview only):
        python usd_to_glb.py

    Execute conversion:
        python usd_to_glb.py --execute

    Single asset:
        python usd_to_glb.py --execute --asset KB3D_IRF_BldgMdMeltingShop_A
================================================
"""

import os
import sys
import argparse
import subprocess
import re
from pathlib import Path

# ── PATHS ──
SOURCE_ROOT = Path(r"E:\Cargo\kb3d_ironforge\Models")
OUTPUT_ROOT = Path(r"E:\AbyssumVIP\Content\src\public\models")
LOG_PATH    = OUTPUT_ROOT / "_conversion_log.txt"

# ── NAME NORMALIZER ──
def to_kebab(name: str) -> str:
    # Strip KB3D_IRF_ prefix
    name = re.sub(r'^KB3D_IRF_', '', name, flags=re.IGNORECASE)
    # PascalCase boundaries
    name = re.sub(r'([a-z])([A-Z])', r'\1-\2', name)
    name = re.sub(r'([0-9])([A-Z])', r'\1-\2', name)
    name = re.sub(r'([A-Z]{2,})([A-Z][a-z])', r'\1-\2', name)
    # Underscores to hyphens
    name = name.replace('_', '-')
    # Collapse multiple hyphens
    name = re.sub(r'-{2,}', '-', name)
    return name.strip('-').lower()

# ── FIND USD ENTRY POINT ──
def find_usd_entry(asset_dir: Path) -> Path | None:
    # Priority: named .usd matching folder name, then any .usd, skip payload/mtl/geo
    skip = {'payload.usd', 'mtl.usd', 'geo.usd', 'mtl.usdc', 'geo.usdc'}
    candidates = [
        f for f in asset_dir.glob('*.usd*')
        if f.name.lower() not in skip and f.suffix.lower() in ('.usd', '.usda', '.usdc')
    ]
    # Prefer file matching folder name
    for c in candidates:
        if c.stem.lower() == asset_dir.name.lower():
            return c
    return candidates[0] if candidates else None

# ── USD -> GLTF via usdexport (built into usd-core) ──
def convert_asset(usd_path: Path, glb_path: Path, dry_run: bool) -> dict:
    result = {
        'source': str(usd_path),
        'output': str(glb_path),
        'status': None,
        'error':  None
    }

    if dry_run:
        result['status'] = 'PREVIEW'
        return result

    glb_path.parent.mkdir(parents=True, exist_ok=True)

    # Use usdcat to flatten the USD stage first, then convert
    # usd-core ships with usdcat and usd2gltf utilities
    try:
        # Step 1: flatten USD composition to single layer
        flat_usd = glb_path.with_suffix('.flat.usda')
        flatten_cmd = [
            sys.executable, '-c',
            f"""
from pxr import Usd, UsdUtils
stage = Usd.Stage.Open(r'{usd_path}')
stage.Export(r'{flat_usd}')
print('FLATTENED')
"""
        ]
        flat_result = subprocess.run(flatten_cmd, capture_output=True, text=True, timeout=60)

        if 'FLATTENED' not in flat_result.stdout:
            result['status'] = 'ERROR'
            result['error'] = f"Flatten failed: {flat_result.stderr[:200]}"
            return result

        # Step 2: convert flattened USD to GLTF using usdcat gltf backend
        convert_cmd = [
            sys.executable, '-c',
            f"""
from pxr import Usd
try:
    from pxr import UsdGltf
    stage = Usd.Stage.Open(r'{flat_usd}')
    UsdGltf.Export(stage, r'{glb_path}')
    print('CONVERTED_GLTF')
except ImportError:
    print('NO_GLTF_BACKEND')
"""
        ]
        conv_result = subprocess.run(convert_cmd, capture_output=True, text=True, timeout=120)

        if 'CONVERTED_GLTF' in conv_result.stdout:
            result['status'] = 'OK'
        elif 'NO_GLTF_BACKEND' in conv_result.stdout:
            # Fallback: use usdcat to export as USDA, flag for Blender manual step
            result['status'] = 'NEEDS_BLENDER'
            result['error'] = 'UsdGltf backend not available - use Blender import for this asset'
        else:
            result['status'] = 'ERROR'
            result['error'] = conv_result.stderr[:200]

        # Cleanup flat file
        if flat_usd.exists():
            flat_usd.unlink()

    except subprocess.TimeoutExpired:
        result['status'] = 'TIMEOUT'
        result['error'] = 'Conversion exceeded 60s limit'
    except Exception as e:
        result['status'] = 'ERROR'
        result['error'] = str(e)[:200]

    return result

# ================================================
# MAIN
# ================================================

def main():
    parser = argparse.ArgumentParser(description='USD to GLB Batch Converter')
    parser.add_argument('--execute', action='store_true', help='Execute conversion (default is dry run)')
    parser.add_argument('--asset',   type=str, default=None, help='Convert single asset by folder name')
    args = parser.parse_args()

    dry_run = not args.execute

    if not SOURCE_ROOT.exists():
        print(f"[ERROR] Source not found: {SOURCE_ROOT}")
        sys.exit(1)

    # Collect asset directories
    if args.asset:
        asset_dirs = [SOURCE_ROOT / args.asset]
        if not asset_dirs[0].exists():
            print(f"[ERROR] Asset not found: {asset_dirs[0]}")
            sys.exit(1)
    else:
        asset_dirs = sorted([d for d in SOURCE_ROOT.iterdir() if d.is_dir()])

    total     = len(asset_dirs)
    ok        = 0
    preview   = 0
    needs_blender = 0
    errors    = 0
    log_lines = []

    print()
    print("=" * 52)
    print("  KB3D IRONFORGE USD → GLB CONVERTER")
    print(f"  Source : {SOURCE_ROOT}")
    print(f"  Output : {OUTPUT_ROOT}")
    print(f"  Assets : {total}")
    print(f"  Mode   : {'DRY RUN' if dry_run else 'EXECUTE'}")
    print("=" * 52)
    print()

    for asset_dir in asset_dirs:
        usd_path = find_usd_entry(asset_dir)

        if not usd_path:
            print(f"  SKIP (no USD) : {asset_dir.name}")
            log_lines.append(f"SKIP_NO_USD|{asset_dir.name}")
            continue

        kebab     = to_kebab(asset_dir.name)
        glb_name  = f"scene-mint-deploy-{kebab}.glb"
        glb_path  = OUTPUT_ROOT / glb_name

        print(f"  MAP  : {asset_dir.name}")
        print(f"       → {glb_name}")

        result = convert_asset(usd_path, glb_path, dry_run)

        if result['status'] == 'PREVIEW':
            print(f"  PREVIEW : {usd_path.name} → {glb_name}")
            log_lines.append(f"PREVIEW|{asset_dir.name}|{glb_name}")
            preview += 1
        elif result['status'] == 'OK':
            print(f"  OK      : {glb_name}")
            log_lines.append(f"OK|{asset_dir.name}|{glb_name}")
            ok += 1
        elif result['status'] == 'NEEDS_BLENDER':
            print(f"  BLENDER : {asset_dir.name} → manual Blender import required")
            log_lines.append(f"NEEDS_BLENDER|{asset_dir.name}|{glb_name}")
            needs_blender += 1
        else:
            print(f"  ERROR   : {asset_dir.name} | {result['error']}")
            log_lines.append(f"ERROR|{asset_dir.name}|{result['error']}")
            errors += 1

        print()

    print("=" * 52)
    print("  SUMMARY")
    print(f"  Total         : {total}")
    print(f"  Previewed     : {preview}")
    print(f"  Converted     : {ok}")
    print(f"  Needs Blender : {needs_blender}")
    print(f"  Errors        : {errors}")
    print(f"  Mode          : {'DRY RUN' if dry_run else 'EXECUTED'}")
    print("=" * 52)
    print()

    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
    with open(LOG_PATH, 'w', encoding='ascii', errors='replace') as f:
        f.write('\n'.join(log_lines))
    print(f"  Log: {LOG_PATH}")
    print()

    if dry_run:
        print("  Preview clean? Run: python usd_to_glb.py --execute")
    print()

if __name__ == '__main__':
    main()
