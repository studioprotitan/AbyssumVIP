import bpy
import os

"""
batch_glb_export.py
Blender Internal script for Phase 8.5 Diesel Punk operations.
"""

# ── CONFIGURATION ──
kit_prefix = "dpk"
output_dir = r"E:\AbyssumVIP\Content\src\public\models"
target_collection = "DieselPunk_Props"

# Name overrides to match MI Manifest and naming convention
# (Source Object Name in Blender) : (Type, Normalized Name, Variant)
name_overrides = {
    "KB3D_DPK_Clock_A": ("prop", "clock", "a"),
    "KB3D_DPK_Banner_B": ("prop", "banner", "b"),
    "KB3D_DPK_Billboard_A": ("prop", "billboard", "a"),
    "KB3D_DPK_BusStop_A": ("prop", "bus-stop", "a"),
    "KB3D_DPK_PostalBox_A": ("prop", "postal-box", "a"),
    "KB3D_DPK_Trash_F": ("prop", "trash", "f"),
    "KB3D_DPK_DrinkingFountain_A": ("prop", "drinking-fountain", "a"),
    "KB3D_DPK_BladeSign_D": ("prop", "blade-sign", "d"),
    "KB3D_DPK_Tower_I": ("prop", "tower", "i"),
    "KB3D_DPK_AstronomyInstitute_A": ("bldg-lg", "astronomy-institute", "a"),
    "KB3D_DPK_AstronomicalAdmin_A": ("bldg-xl", "astronomical-admin", "a"),
}

def export_assets():
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        print(f"Created directory: {output_dir}")

    # Find the target collection
    collection = bpy.data.collections.get(target_collection)
    if not collection:
        print(f"Error: Collection '{target_collection}' not found.")
        return

    print(f"Exporting assets from: {target_collection}")

    for obj in collection.objects:
        if obj.type != 'MESH':
            continue

        # Determine naming
        if obj.name in name_overrides:
            typ, name, var = name_overrides[obj.name]
            glb_filename = f"scene-mint-deploy-{kit_prefix}-{typ}-{name}-{var}.glb"
        else:
            # Fallback normalization
            clean_name = obj.name.lower().replace("kb3d_dpk_", "").replace("_", "-")
            glb_filename = f"scene-mint-deploy-{kit_prefix}-prop-{clean_name}.glb"

        export_path = os.path.join(output_dir, glb_filename)

        # Selection logic
        bpy.ops.object.select_all(action='DESELECT')
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj

        # Export
        try:
            bpy.ops.export_scene.gltf(
                filepath=export_path,
                export_format='GLB',
                use_selection=True,
                export_apply=True,
                export_materials='EXPORT',
                export_texcoords=True,
                export_normals=True
            )
            print(f"SUCCESS: {glb_filename}")
        except Exception as e:
            print(f"FAILED: {obj.name} | {str(e)}")

if __name__ == "__main__":
    export_assets()