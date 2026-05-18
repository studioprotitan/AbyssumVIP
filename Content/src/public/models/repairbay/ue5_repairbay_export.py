"""
ue5_repairbay_export.py
GenesisVerse_P1 — RepairBay_Deploy_Deck GLTF Export
SIMPRO TITANS STUDIO — Phase 9 CDN Pipeline

HOW TO RUN:
  In UE5 Python Console (bottom of editor), type:
    py "C:/Developer/AbyssumVIP/Content/src/public/models/repairbay/ue5_repairbay_export.py"

OUTPUT:
  C:/Developer/AbyssumVIP/Content/src/public/models/repairbay/repairbay_lower.gltf
  C:/Developer/AbyssumVIP/Content/src/public/models/repairbay/repairbay_camera.json
"""

import unreal
import json
import os

# ── CONFIG ──────────────────────────────────────────────────────────────────
EXPORT_DIR = "C:/Developer/AbyssumVIP/Content/src/public/models/repairbay/"
LEVEL_PATH = "/Game/Modular_Scifi_Mechanic_Base/Map/RepairBay_Deploy_Deck"

# UE5 → Babylon.js axis conversion (Z-up → Y-up)
# UE5: X=forward, Y=right, Z=up  (cm)
# Babylon: X=right, Y=up, Z=forward (same units, divide by 1 since Babylon handles scale)
def ue5_to_babylon(ue_x, ue_y, ue_z):
    """Convert UE5 world coords (cm) to Babylon.js coords."""
    return {
        "x": ue_y / 100.0,   # UE right → Babylon X
        "y": ue_z / 100.0,   # UE up    → Babylon Y
        "z": ue_x / 100.0    # UE fwd   → Babylon Z
    }

# ── ENSURE OUTPUT DIR ────────────────────────────────────────────────────────
os.makedirs(EXPORT_DIR, exist_ok=True)
print(f"[EXPORT] Output dir ready: {EXPORT_DIR}")

# ── CAMERA EXPORT (axis-corrected) ──────────────────────────────────────────
# CameraActor from handoff: -4285.26, -800.248, 253.786  rotation Z=179.822
# moai-osu-a target:        -4422.01, -499.880, 250.676

cam_ue = (-4285.26, -800.248, 253.786)
target_ue = (-4422.01, -499.880, 250.676)

cam_babylon = ue5_to_babylon(*cam_ue)
target_babylon = ue5_to_babylon(*target_ue)

cameras = {
    "cameras": [
        {
            "name": "repairbay_entry",
            "type": "ArcRotateCamera",
            "position": cam_babylon,
            "target": target_babylon,
            "fov": 0.8,
            "nearClip": 0.1,
            "farClip": 500.0,
            "notes": "Entry view — moai-osu-a framed right, platform center"
        },
        {
            "name": "repairbay_platform_wide",
            "type": "ArcRotateCamera",
            "position": ue5_to_babylon(-4200.0, -600.0, 400.0),
            "target": ue5_to_babylon(-4422.01, -499.880, 250.676),
            "fov": 1.0,
            "nearClip": 0.1,
            "farClip": 500.0,
            "notes": "Wide shot — full platform + overhead crane visible"
        },
        {
            "name": "repairbay_elevator",
            "type": "ArcRotateCamera",
            "position": ue5_to_babylon(-3800.0, -500.0, 350.0),
            "target": ue5_to_babylon(-4000.0, -500.0, 300.0),
            "fov": 0.9,
            "nearClip": 0.1,
            "farClip": 500.0,
            "notes": "Elevator approach — transition zone to Hype Stage"
        }
    ],
    "default": "repairbay_entry",
    "forge_confirm_load": "repairbay_entry"
}

cam_path = EXPORT_DIR + "cameras.json"
with open(cam_path, "w") as f:
    json.dump(cameras, f, indent=2)
print(f"[EXPORT] cameras.json written (3 cameras, axis-corrected): {cam_path}")

# ── GLTF LEVEL EXPORT ────────────────────────────────────────────────────────
# Use UE5 GLTFExporter plugin (confirmed mounted in log)
# This exports the entire level as GLTF — environment only, no skeletal meshes

try:
    export_options = unreal.GLTFExportOptions()
    export_options.export_hidden_objects = False
    export_options.export_lights = True
    export_options.export_cameras = True
    export_options.texture_image_format = unreal.GLTFTextureImageFormat.PNG
    export_options.bake_material_inputs = unreal.GLTFMaterialBakeMode.DISABLED

    # Load the level asset
    level_asset = unreal.EditorAssetLibrary.load_asset(LEVEL_PATH)

    task = unreal.AssetExportTask()
    task.automated = True
    task.replace_identical = True
    task.object = level_asset
    task.exporter = unreal.GLTFLevelExporter()
    task.filename = EXPORT_DIR + "repairbay_lower.gltf"
    task.options = export_options

    result = unreal.Exporter.run_asset_export_task(task)

    if result:
        print(f"[EXPORT] SUCCESS: repairbay_lower.gltf exported to {EXPORT_DIR}")
    else:
        print("[EXPORT] WARNING: Export task returned False — check Output Log for errors")
        print("[EXPORT] Fallback: Use File → Export All menu with GLTFExporter selected")

except Exception as e:
    print(f"[EXPORT] ERROR: {e}")
    print("[EXPORT] Manual fallback: File → Export All → select repairbay_lower.gltf")
    print("[EXPORT]   Ensure GLTFExporter plugin is active (confirmed in log)")

# ── SUMMARY ──────────────────────────────────────────────────────────────────
print("\n[EXPORT] ── PHASE 9 EXPORT SUMMARY ──")
print(f"  cameras.json    → {cam_path}")
print(f"  repairbay_lower.gltf → {EXPORT_DIR}repairbay_lower.gltf")
print("\n[EXPORT] NEXT: git add + commit both files, then gh release upload to repairbay-v1.1")
print("[EXPORT] COMMIT MSG: 'feat: repairbay GLTF export + axis-corrected cameras [CDN-ENV-001]'")
