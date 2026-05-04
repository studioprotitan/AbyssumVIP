"""
batch_glb_export.py
Simpro Titans Studio — Batch GLB Export for Blender 4.x / 5.x
Phase 8.5 | scene-mint-deploy naming convention

USAGE (Blender Scripting tab):
    1. Open Blender, load your .blend scene
    2. Open Scripting workspace
    3. Open this script → Run Script (Alt+P)
    4. Exports each object or collection as a separate GLB

CONFIGURATION:
    Edit the CONFIG block below before running.

NAMING CONVENTION:
    scene-mint-deploy-[kit_prefix]-[type]-[name]-[variant].glb
    e.g. scene-mint-deploy-dpk-prop-clock-a.glb
         scene-mint-deploy-ife-bldg-forge-hall-a.glb

"""

import bpy
import os
import re
from pathlib import Path

# ══════════════════════════════════════════════════════════════
# CONFIG — edit before running
# ══════════════════════════════════════════════════════════════

CONFIG = {
    # Output directory (must exist or will be created)
    "output_dir": r"E:\AbyssumVIP\Content\src\public\models",

    # Kit prefix for naming
    # dpk = Diesel Punk | ife = Iron Forge | spk = Steam Punk | csk = City Sky
    "kit_prefix": "dpk",

    # Export mode:
    #   "selection"  — exports only selected objects as one GLB each
    #   "collection" — exports objects from TARGET_COLLECTION, one GLB each
    #   "scene"      — exports all mesh objects in scene, one GLB each
    "mode": "collection",

    # Collection name (used when mode = "collection")
    "target_collection": "DieselPunk_Props",

    # Skip objects whose names contain these strings (case-insensitive)
    "skip_patterns": ["_skeleton", "SK_", "armature", "_rig", "_ctrl", "camera", "light", "empty"],

    # Export settings
    "export_draco": False,           # Set True to enable Draco compression
    "export_apply_modifiers": True,
    "export_materials": True,
    "export_normals": True,
    "export_tangents": False,
    "export_uvs": True,
    "export_colors": True,
    "export_cameras": False,
    "export_lights": False,

    # Name override map: Blender object name → custom suffix
    # If object name is in this map, use the mapped suffix instead of auto-derived
    # Format: "BlenderObjectName": "desired-kebab-suffix"
    "name_overrides": {
        "Clock_A":              "prop-clock-a",
        "Banner_B":             "prop-banner-b",
        "Billboard_A":          "prop-billboard-a",
        "BusStop_A":            "prop-bus-stop-a",
        "PostalBox_A":          "prop-postal-box-a",
        "Trash_F":              "prop-trash-f",
        "DrinkingFountain_A":   "prop-drinking-fountain-a",
        "BladeSign_D":          "prop-blade-sign-d",
        "Tower_I":              "prop-tower-i",
        "AstronomyInstitute_A": "bldg-lg-astronomy-institute-a",
        "AstronomicalAdmin_A":  "bldg-xl-astronomical-admin-a",
    },
}

# ══════════════════════════════════════════════════════════════
# HELPERS
# ══════════════════════════════════════════════════════════════

def to_kebab(name: str) -> str:
    """Convert PascalCase / snake_case / mixed to kebab-case."""
    s = name
    # Remove file extensions if any
    s = re.sub(r'\.[^.]+$', '', s)
    # PascalCase boundary
    s = re.sub(r'([a-z])([A-Z])', r'\1-\2', s)
    s = re.sub(r'([0-9])([A-Z])', r'\1-\2', s)
    s = re.sub(r'([A-Z]+)([A-Z][a-z])', r'\1-\2', s)
    # Underscores → hyphens
    s = s.replace('_', '-')
    # Collapse
    s = re.sub(r'-+', '-', s)
    s = s.strip('-')
    return s.lower()


def should_skip(obj_name: str) -> bool:
    name_lower = obj_name.lower()
    for pattern in CONFIG["skip_patterns"]:
        if pattern.lower() in name_lower:
            return True
    return False


def build_output_name(obj_name: str) -> str:
    kit = CONFIG["kit_prefix"]
    if obj_name in CONFIG["name_overrides"]:
        suffix = CONFIG["name_overrides"][obj_name]
    else:
        suffix = to_kebab(obj_name)
    return f"scene-mint-deploy-{kit}-{suffix}.glb"


def get_target_objects() -> list:
    mode = CONFIG["mode"]
    if mode == "selection":
        return [o for o in bpy.context.selected_objects if o.type == 'MESH']
    elif mode == "collection":
        coll_name = CONFIG["target_collection"]
        coll = bpy.data.collections.get(coll_name)
        if coll is None:
            raise ValueError(f"Collection '{coll_name}' not found in scene.")
        return [o for o in coll.all_objects if o.type == 'MESH']
    elif mode == "scene":
        return [o for o in bpy.context.scene.objects if o.type == 'MESH']
    else:
        raise ValueError(f"Unknown export mode: {mode}")


def deselect_all():
    bpy.ops.object.select_all(action='DESELECT')


def export_object_as_glb(obj, output_path: str):
    """Select only this object and export as GLB."""
    deselect_all()
    obj.select_set(True)
    # Also select children (e.g. child meshes of armature) if any
    for child in obj.children_recursive:
        child.select_set(True)
    bpy.context.view_layer.objects.active = obj

    bpy.ops.export_scene.gltf(
        filepath=output_path,
        use_selection=True,
        export_format='GLB',
        export_draco_mesh_compression_enable=CONFIG["export_draco"],
        export_apply=CONFIG["export_apply_modifiers"],
        export_materials='EXPORT' if CONFIG["export_materials"] else 'NONE',
        export_normals=CONFIG["export_normals"],
        export_tangents=CONFIG["export_tangents"],
        export_texcoords=CONFIG["export_uvs"],
        export_colors=CONFIG["export_colors"],
        export_cameras=CONFIG["export_cameras"],
        export_lights=CONFIG["export_lights"],
    )


# ══════════════════════════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════════════════════════

def main():
    output_dir = Path(CONFIG["output_dir"])
    output_dir.mkdir(parents=True, exist_ok=True)

    objects = get_target_objects()
    total = len(objects)
    exported = 0
    skipped = 0
    errors = []

    print("\n" + "=" * 60)
    print(f"  BATCH GLB EXPORT | Simpro Titans Studio")
    print(f"  Kit    : {CONFIG['kit_prefix'].upper()}")
    print(f"  Mode   : {CONFIG['mode']}")
    print(f"  Output : {output_dir}")
    print(f"  Objects: {total}")
    print("=" * 60)

    # Store original selection to restore later
    original_active = bpy.context.view_layer.objects.active
    original_selected = [o for o in bpy.context.selected_objects]

    for obj in objects:
        if should_skip(obj.name):
            print(f"  SKIP   : {obj.name} (pattern match)")
            skipped += 1
            continue

        filename = build_output_name(obj.name)
        output_path = str(output_dir / filename)

        try:
            export_object_as_glb(obj, output_path)
            print(f"  OK     : {obj.name} → {filename}")
            exported += 1
        except Exception as e:
            print(f"  ERR    : {obj.name} | {e}")
            errors.append((obj.name, str(e)))

    # Restore selection
    deselect_all()
    for o in original_selected:
        try:
            o.select_set(True)
        except Exception:
            pass
    if original_active:
        bpy.context.view_layer.objects.active = original_active

    print("\n" + "=" * 60)
    print(f"  COMPLETE")
    print(f"  Exported : {exported}")
    print(f"  Skipped  : {skipped}")
    print(f"  Errors   : {len(errors)}")
    if errors:
        print("\n  ERROR DETAIL:")
        for name, err in errors:
            print(f"    {name}: {err}")
    print("=" * 60 + "\n")


# ── Run ──
if __name__ == "__main__":
    main()
else:
    # When run from Blender's text editor via Alt+P
    main()
