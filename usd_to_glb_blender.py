"""
================================================
usd_to_glb_blender.py
Abyssum Pipeline - Kitbash3D USD to GLB via Blender
Commander: Antonio | Simpro Titans Studio, LLC
================================================
USAGE:
    Dry run:
        python usd_to_glb_blender.py

    Execute - single kit:
        python usd_to_glb_blender.py --execute --kit ironforge

    Execute - all downloaded kits:
        python usd_to_glb_blender.py --execute --all

    Single asset:
        python usd_to_glb_blender.py --execute --kit ironforge --asset KB3D_IRF_BldgMdMeltingShop_A
================================================
"""

import os
import sys
import argparse
import subprocess
import re
import tempfile
from pathlib import Path

# ── CONFIGURATION ──
BLENDER_EXE  = Path(r"C:\Developer\Blender\blender.exe")
CARGO_ROOT   = Path(r"E:\Cargo")
OUTPUT_ROOT  = Path(r"E:\AbyssumVIP\Content\src\public\models")

# Kit folder name → source models path
KITS = {
    "ironforge":  CARGO_ROOT / "kb3d_ironforge"  / "Models",
    "diesel_punk": CARGO_ROOT / "kb3d_diesel_punk_6.0.1" / "Models",
    "citysky":    CARGO_ROOT / "kb3d_citysky"     / "Models",
    "brutalist":  CARGO_ROOT / "kb3d_brutalist"   / "Models",
    "minerva":    CARGO_ROOT / "kb3d_minerva"     / "Models",
    "steampunk":  CARGO_ROOT / "kb3d_steampunk"   / "Models",
    "utopia":     CARGO_ROOT / "kb3d_utopia"      / "Models",
}

# ── NAME NORMALIZER ──
def to_kebab(name: str) -> str:
    name = re.sub(r'^KB3D_[A-Z]+_', '', name, flags=re.IGNORECASE)
    name = re.sub(r'([a-z])([A-Z])', r'\1-\2', name)
    name = re.sub(r'([0-9])([A-Z])', r'\1-\2', name)
    name = re.sub(r'([A-Z]{2,})([A-Z][a-z])', r'\1-\2', name)
    name = name.replace('_', '-')
    name = re.sub(r'-{2,}', '-', name)
    return name.strip('-').lower()

# ── FIND USD ENTRY POINT ──
def find_usd_entry(asset_dir: Path) -> Path | None:
    skip = {'payload.usd', 'mtl.usd', 'geo.usd', 'mtl.usdc', 'geo.usdc'}
    candidates = [
        f for f in asset_dir.glob('*.usd*')
        if f.name.lower() not in skip
        and f.suffix.lower() in ('.usd', '.usda', '.usdc')
    ]
    for c in candidates:
        if c.stem.lower() == asset_dir.name.lower():
            return c
    return candidates[0] if candidates else None

# ── BLENDER IMPORT SCRIPT (written to temp file per asset) ──
BLENDER_SCRIPT = '''
import bpy
import sys
import os

usd_path = sys.argv[sys.argv.index("--") + 1]
glb_path = sys.argv[sys.argv.index("--") + 2]

# Clear default scene
bpy.ops.wm.read_factory_settings(use_empty=True)
for obj in bpy.data.objects:
    bpy.data.objects.remove(obj, do_unlink=True)

# Import USD
try:
    bpy.ops.wm.usd_import(
        filepath=usd_path,
        import_cameras=False,
        import_lights=False,
        import_materials=True,
        import_meshes=True,
        support_scene_instancing=True,
        import_visible_only=True,
        create_collection=True,
        read_mesh_uvs=True,
        read_mesh_colors=True,
        read_mesh_attributes=True,
        import_usd_preview=True,
        set_frame_range=False,
        relative_path=False,
        prim_path_mask="",
        scale=1.0,
        validate_meshes=True,
        import_defined_only=False,
    )
    print(f"USD_IMPORTED: {usd_path}")
except Exception as e:
    print(f"USD_IMPORT_ERROR: {e}")
    sys.exit(1)

# Select all mesh objects
bpy.ops.object.select_all(action="SELECT")

# Export GLB
try:
    os.makedirs(os.path.dirname(glb_path), exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=glb_path,
        export_format="GLB",
        use_selection=False,
        export_apply=True,
        export_materials="EXPORT",
        export_texcoords=True,
        export_normals=True,
        export_colors=True,
        export_cameras=False,
        export_lights=False,
    )
    print(f"GLB_EXPORTED: {glb_path}")
except Exception as e:
    print(f"GLB_EXPORT_ERROR: {e}")
    sys.exit(1)
'''

# ── RUN BLENDER HEADLESS ──
def convert_with_blender(usd_path: Path, glb_path: Path) -> dict:
    result = {'status': None, 'error': None}

    # Write blender script to temp file
    with tempfile.NamedTemporaryFile(
        mode='w', suffix='.py', delete=False, encoding='utf-8'
    ) as f:
        f.write(BLENDER_SCRIPT)
        script_path = f.name

    try:
        cmd = [
            str(BLENDER_EXE),
            '--background',
            '--python', script_path,
            '--',
            str(usd_path),
            str(glb_path)
        ]

        proc = subprocess.run(
            cmd,
            capture_output=True,
            text=False,
            timeout=180
        )

        stdout = proc.stdout.decode('utf-8', errors='replace') if proc.stdout else ''
        stderr = proc.stderr.decode('utf-8', errors='replace') if proc.stderr else ''
        combined = stdout + stderr

        if 'GLB_EXPORTED' in combined:
            result['status'] = 'OK'
        elif 'USD_IMPORT_ERROR' in combined:
            for line in combined.splitlines():
                if 'USD_IMPORT_ERROR' in line:
                    result['error'] = line.strip()
            result['status'] = 'ERROR'
        elif 'GLB_EXPORT_ERROR' in combined:
            for line in combined.splitlines():
                if 'GLB_EXPORT_ERROR' in line:
                    result['error'] = line.strip()
            result['status'] = 'ERROR'
        else:
            result['status'] = 'ERROR'
            result['error'] = stderr[-300:] if stderr else 'Unknown error'

    except subprocess.TimeoutExpired:
        result['status'] = 'TIMEOUT'
        result['error'] = 'Blender exceeded 180s limit'
    except Exception as e:
        result['status'] = 'ERROR'
        result['error'] = str(e)
    finally:
        os.unlink(script_path)

    return result

# ================================================
# MAIN
# ================================================

def run_kit(kit_name: str, source_root: Path, dry_run: bool,
            single_asset: str | None, log_lines: list) -> dict:

    if not source_root.exists():
        print(f"  [SKIP] Kit path not found: {source_root}")
        return {'total': 0, 'ok': 0, 'errors': 0, 'timeout': 0}

    if single_asset:
        asset_dirs = [source_root / single_asset]
    else:
        asset_dirs = sorted([d for d in source_root.iterdir() if d.is_dir()])

    counts = {'total': len(asset_dirs), 'ok': 0, 'errors': 0, 'timeout': 0}

    print(f"\n  KIT: {kit_name.upper()} — {counts['total']} assets")
    print(f"  {'─' * 46}")

    for asset_dir in asset_dirs:
        usd_path = find_usd_entry(asset_dir)

        if not usd_path:
            print(f"  SKIP (no USD) : {asset_dir.name}")
            log_lines.append(f"SKIP_NO_USD|{kit_name}|{asset_dir.name}")
            continue

        kebab    = to_kebab(asset_dir.name)
        glb_name = f"scene-mint-deploy-{kebab}.glb"
        glb_path = OUTPUT_ROOT / glb_name

        if dry_run:
            print(f"  PREVIEW : {asset_dir.name}")
            print(f"          → {glb_name}")
            log_lines.append(f"PREVIEW|{kit_name}|{asset_dir.name}|{glb_name}")
            continue

        print(f"  CONVERTING : {asset_dir.name}", end='', flush=True)
        result = convert_with_blender(usd_path, glb_path)

        if result['status'] == 'OK':
            size_mb = glb_path.stat().st_size / 1_048_576 if glb_path.exists() else 0
            print(f"\n  OK         : {glb_name} ({size_mb:.1f} MB)")
            log_lines.append(f"OK|{kit_name}|{asset_dir.name}|{glb_name}|{size_mb:.1f}MB")
            counts['ok'] += 1
        elif result['status'] == 'TIMEOUT':
            print(f"\n  TIMEOUT    : {asset_dir.name}")
            log_lines.append(f"TIMEOUT|{kit_name}|{asset_dir.name}")
            counts['timeout'] += 1
        else:
            print(f"\n  ERROR      : {asset_dir.name} | {result['error']}")
            log_lines.append(f"ERROR|{kit_name}|{asset_dir.name}|{result['error']}")
            counts['errors'] += 1

    return counts

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--execute', action='store_true')
    parser.add_argument('--kit',    type=str, default='ironforge',
                        choices=list(KITS.keys()),
                        help='Kit to convert (default: ironforge)')
    parser.add_argument('--all',    action='store_true',
                        help='Convert all downloaded kits')
    parser.add_argument('--asset',  type=str, default=None,
                        help='Single asset folder name')
    args = parser.parse_args()

    dry_run = not args.execute

    if not BLENDER_EXE.exists():
        print(f"[ERROR] Blender not found: {BLENDER_EXE}")
        sys.exit(1)

    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)

    kits_to_run = KITS if args.all else {args.kit: KITS[args.kit]}

    print()
    print("=" * 52)
    print("  KB3D USD → GLB CONVERTER (BLENDER)")
    print(f"  Blender : {BLENDER_EXE}")
    print(f"  Output  : {OUTPUT_ROOT}")
    print(f"  Kits    : {', '.join(kits_to_run.keys())}")
    print(f"  Mode    : {'DRY RUN' if dry_run else 'EXECUTE'}")
    print("=" * 52)

    log_lines  = []
    total_ok   = 0
    total_err  = 0
    total_time = 0

    for kit_name, source_root in kits_to_run.items():
        counts = run_kit(kit_name, source_root, dry_run, args.asset, log_lines)
        total_ok   += counts['ok']
        total_err  += counts['errors']
        total_time += counts['timeout']

    print()
    print("=" * 52)
    print("  FINAL SUMMARY")
    print(f"  Converted : {total_ok}")
    print(f"  Errors    : {total_err}")
    print(f"  Timeouts  : {total_time}")
    print(f"  Mode      : {'DRY RUN' if dry_run else 'EXECUTED'}")
    print("=" * 52)
    print()

    log_path = OUTPUT_ROOT / "_blender_conversion_log.txt"
    with open(log_path, 'w', encoding='ascii', errors='replace') as f:
        f.write('\n'.join(log_lines))
    print(f"  Log: {log_path}")
    print()

    if dry_run:
        print("  Execute Iron Forge:  python usd_to_glb_blender.py --execute --kit ironforge")
        print("  Execute all kits:    python usd_to_glb_blender.py --execute --all")
    print()

if __name__ == '__main__':
    main()
