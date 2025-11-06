// Assets/Editor/PassageManagerPopulator.cs
using UnityEngine;
using UnityEditor;
using System.Linq;

public class PassageManagerPopulator
{
    // The folder where all the assets are stored
    private const string ASSET_FOLDER = "Assets/Narrative/PassageAssets";

    // This adds the menu item, usable only when a GameObject is selected
    [MenuItem("GameObject/Narrative/Populate Passage Asset Manager", false, 10)]
    private static void PopulateManager()
    {
        // Get the GameObject the user has selected
        GameObject selectedGO = Selection.activeGameObject;
        if (selectedGO == null)
        {
            EditorUtility.DisplayDialog("Error", "Please select the GameObject (or Prefab) with the PassageAssetManager component in the scene or hierarchy.", "OK");
            return;
        }

        PassageAssetManager manager = selectedGO.GetComponent<PassageAssetManager>();
        if (manager == null)
        {
            EditorUtility.DisplayDialog("Error", $"The selected object '{selectedGO.name}' does not have a PassageAssetManager component.", "OK");
            return;
        }

        // 1. Find all PassageAsset files in the project folder
        string[] guids = AssetDatabase.FindAssets($"t:{typeof(PassageAsset).Name}", new[] { ASSET_FOLDER });

        // 2. Load them and clear the manager's old list
        manager.allPassageAssets.Clear();
        foreach (string guid in guids)
        {
            string path = AssetDatabase.GUIDToAssetPath(guid);
            PassageAsset asset = AssetDatabase.LoadAssetAtPath<PassageAsset>(path);
            if (asset != null)
            {
                manager.allPassageAssets.Add(asset);
            }
        }

        // 3. Save the changes
        // This "dirties" the component so Unity knows it needs to be saved.
        EditorUtility.SetDirty(manager);
        
        // If it's a prefab, save the prefab. Otherwise, the scene will be marked dirty.
        if (PrefabUtility.IsPartOfPrefabAsset(manager.gameObject))
        {
            PrefabUtility.SaveAsPrefabAsset(manager.gameObject, PrefabUtility.GetPrefabAssetPathOfNearestInstanceRoot(manager.gameObject));
        }

        Debug.Log($"Successfully populated {manager.name} with {manager.allPassageAssets.Count} PassageAssets.");
        EditorUtility.DisplayDialog("Success", $"Successfully populated {manager.name} with {manager.allPassageAssets.Count} PassageAssets.", "OK");
    }
}
