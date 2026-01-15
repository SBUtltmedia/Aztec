using UnityEditor;
using UnityEngine;
using System.Collections.Generic;

/// <summary>
/// Removes SampleScene from build settings - we only need the generated passage scenes
/// </summary>
public class CleanupBuildSettings
{
    [MenuItem("Tools/Remove SampleScene from Build")]
    public static void RemoveSampleScene()
    {
        List<EditorBuildSettingsScene> scenes = new List<EditorBuildSettingsScene>();

        foreach (EditorBuildSettingsScene scene in EditorBuildSettings.scenes)
        {
            // Keep all scenes except SampleScene
            if (!scene.path.Contains("SampleScene"))
            {
                scenes.Add(scene);
            }
            else
            {
                Debug.Log("Removing SampleScene from build settings: " + scene.path);
            }
        }

        EditorBuildSettings.scenes = scenes.ToArray();
        Debug.Log($"Build settings updated. {scenes.Count} scenes remaining.");
    }

    // Method that can be called from command line
    public static void RemoveSampleSceneBatch()
    {
        RemoveSampleScene();
        Debug.Log("SampleScene removed from build settings.");
    }
}
