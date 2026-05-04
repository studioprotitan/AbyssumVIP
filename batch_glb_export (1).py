# ============================================================
# batch_glb_export.py
# Phase 8.5 — Diesel Punk GLB Export Pipeline
# Blender 5.0 Internal Script
# Run from: Blender → Scripting tab → Run Script
# ============================================================
#
# PYLANCE WARNING: "Import bpy could not be resolved"
# This is expected and correct. bpy is Blender's internal API.
# It does not exist outside Blender's embedded Python interpreter.
# The line below suppresses it permanently — do not remove it.
#
# pyright: reportMissingImports=false
# type: ignore[import]
#
# ============================================================

import bpy  # type: ignore
import os

# ── CONFIGURATION — edit these before running ─────────────────

CONFIG = {
    # Prefix for all output filenames
    "kit_prefix": "dpk",

    # Absolute path to output directory
    # Must match mi_manifest_dpk.json → kit.export_path
    "output_dir": r"E:\AbyssumVIP\Content\src\public\models",

    # Name of the Blender collection containing Diesel Punk assets
    # Change this to match your scene's collection name
    "target_collection": "DieselPunk_Props",

    # If True: lists what would export without writing files
    # Set to False to actually export
    "dry_run": True,
}

# ── Name overrides ────────────────────────────────────────────
# Maps Blender object name → (type, normalized-name, variant)
# Must match mi_manifest_dpk.json asset IDs exactly.
# Pattern: scene-mint-deploy-{kit_prefix}-{type}-{name}-{variant}.glb

NAME_OVERRIDES = {
    "KB3D_DPK_Clock_A":              ("prop",    "clock",                "a"),
    "KB3D_DPK_Banner_B":             ("prop",    "banner",               "b"),
    "KB3D_DPK_Billboard_A":          ("prop",    "billboard",            "a"),
    "KB3D_DPK_BusStop_A":            ("prop",    "bus-stop",             "a"),
    "KB3D_DPK_PostalBox_A":          ("prop",    "postal-box",           "a"),
    "KB3D_DPK_Trash_F":              ("prop",    "trash",                "f"),
    "KB3D_DPK_DrinkingFountain_A":   ("prop",    "drinking-fountain",    "a"),
    "KB3D_DPK_BladeSign_D":          ("prop",    "blade-sign",           "d"),
    "KB3D_DPK_Tower_I":              ("prop",    "tower",                "i"),
    "KB3D_DPK_AstronomyInstitute_A": ("bldg-lg", "astronomy-institute",  "a"),
    "KB3D_DPK_AstronomicalAdmin_A":  ("bldg-xl", "astronomical-admin",   "a"),
}

# Assets that must NOT export — flag in manifest as PENDING_EXPORT
# until resolved. Add names here to block them.
BLOCKED_ASSETS = {
    # "KB3D_DPK_Banner_B",  # RESOLVED: Status CONFIRMED in mi_manifest_dpk.json
}


# ── Export function ───────────────────────────────────────────

def build_filename(obj_name: str) -> str:
    prefix = CONFIG["kit_prefix"]
    if obj_name in NAME_OVERRIDES:
        typ, name, var = NAME_OVERRIDES[obj_name]
        return f"scene-mint-deploy-{prefix}-{typ}-{name}-{var}.glb"
    # Fallback: normalize from Blender object name
    clean = obj_name.lower().replace("kb3d_dpk_", "").replace("_", "-")
    return f"scene-mint-deploy-{prefix}-prop-{clean}.glb"


def export_assets() -> None:
    output_dir = CONFIG["output_dir"]
    dry_run    = CONFIG["dry_run"]
    col_name   = CONFIG["target_collection"]

    print("\n" + "=" * 56)
    print(f"  BATCH GLB EXPORT — Phase 8.5 Diesel Punk")
    print(f"  Mode     : {'DRY RUN' if dry_run else 'EXECUTE'}")
    print(f"  Output   : {output_dir}")
    print(f"  Collection: {col_name}")
    print("=" * 56 + "\n")

    if not dry_run and not os.path.exists(output_dir):
        os.makedirs(output_dir)
        print(f"  Created directory: {output_dir}")

    collection = bpy.data.collections.get(col_name)
    if not collection:
        print(f"  ERROR: Collection '{col_name}' not found in scene.")
        print(f"  Available collections: {[c.name for c in bpy.data.collections]}")
        return

    exported = 0
    blocked  = 0
    failed   = 0

    for obj in collection.objects:
        if obj.type != 'MESH':
            continue

        # Block flagged assets
        if obj.name in BLOCKED_ASSETS:
            print(f"  BLOCKED : {obj.name} — resolve material flag before export")
            blocked += 1
            continue

        filename    = build_filename(obj.name)
        export_path = os.path.join(output_dir, filename)

        if dry_run:
            print(f"  DRY RUN : {obj.name} → {filename}")
            exported += 1
            continue

        # Select only this object
        bpy.ops.object.select_all(action='DESELECT')
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj

        try:
            bpy.ops.export_scene.gltf(
                filepath=export_path,
                export_format='GLB',
                use_selection=True,
                export_apply=True,          # Apply modifiers on export
                export_materials='EXPORT',
                export_texcoords=True,
                export_normals=True,
                export_draco_mesh_compression_enable=False,  # Draco off until pipeline fix
            )
            print(f"  SUCCESS : {filename}")
            exported += 1
        except Exception as e:
            print(f"  FAILED  : {obj.name} | {e}")
            failed += 1

    print("\n" + "=" * 56)
    print(f"  Exported : {exported}")
    print(f"  Blocked  : {blocked}")
    print(f"  Failed   : {failed}")
    if dry_run:
        print(f"  Set CONFIG['dry_run'] = False to execute")
    print("=" * 56 + "\n")


# ── Entry point ───────────────────────────────────────────────
export_assets()
