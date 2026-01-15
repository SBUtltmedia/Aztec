using UnityEngine;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine.SceneManagement;
using TMPro;
using System.Collections.Generic;

/// <summary>
/// Automatically generates Unity scenes that match Twine passage names.
/// Each scene includes a Bridge GameObject and visual feedback showing the scene name.
/// </summary>
public class SceneGenerator : EditorWindow
{
    private static readonly string[] SCENE_NAMES = new string[]
    {
        "Start",
        "Initialize User",
        "Hub",
        "Shared Counter Demo",
        "Message Board Demo",
        "User Registry Demo",
        "About the Engine"
    };

    [MenuItem("Tools/Generate Twine Passage Scenes")]
    public static void ShowWindow()
    {
        GetWindow<SceneGenerator>("Scene Generator");
    }

    void OnGUI()
    {
        GUILayout.Label("Twine Passage Scene Generator", EditorStyles.boldLabel);
        GUILayout.Space(10);

        GUILayout.Label("This will create the following scenes:");
        foreach (string sceneName in SCENE_NAMES)
        {
            GUILayout.Label("  • " + sceneName);
        }

        GUILayout.Space(10);
        GUILayout.Label("Each scene will include:");
        GUILayout.Label("  • Canvas with scene name text");
        GUILayout.Label("  • Bridge GameObject with StateBridge component");
        GUILayout.Space(20);

        if (GUILayout.Button("Generate All Scenes", GUILayout.Height(40)))
        {
            GenerateAllScenes();
        }

        GUILayout.Space(10);

        if (GUILayout.Button("Add All Scenes to Build Settings", GUILayout.Height(30)))
        {
            AddScenesToBuildSettings();
        }
    }

    static void GenerateAllScenes()
    {
        // Ensure Scenes directory exists
        if (!AssetDatabase.IsValidFolder("Assets/Scenes"))
        {
            AssetDatabase.CreateFolder("Assets", "Scenes");
        }

        foreach (string sceneName in SCENE_NAMES)
        {
            CreateScene(sceneName);
        }

        Debug.Log($"Successfully generated {SCENE_NAMES.Length} scenes!");
        EditorUtility.DisplayDialog("Success", $"Generated {SCENE_NAMES.Length} scenes in Assets/Scenes/", "OK");
    }

    static void CreateScene(string sceneName)
    {
        // Create new scene - EMPTY, not DefaultGameObjects (faster, smaller)
        Scene newScene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);

        // Add minimal camera
        GameObject cameraGO = new GameObject("Main Camera");
        Camera camera = cameraGO.AddComponent<Camera>();
        camera.clearFlags = CameraClearFlags.SolidColor;
        camera.backgroundColor = Color.black;
        cameraGO.tag = "MainCamera";

        // Create Canvas
        GameObject canvasGO = new GameObject("Canvas");
        Canvas canvas = canvasGO.AddComponent<Canvas>();
        canvas.renderMode = RenderMode.ScreenSpaceOverlay;
        canvasGO.AddComponent<UnityEngine.UI.CanvasScaler>();
        canvasGO.AddComponent<UnityEngine.UI.GraphicRaycaster>();

        // Create Text element for scene name
        GameObject textGO = new GameObject("SceneNameText");
        textGO.transform.SetParent(canvasGO.transform);

        // Use legacy Text instead of TextMeshPro to avoid font asset issues
        // TMP requires font assets which aren't included in minimal builds
        bool useTMP = false; // Disabled - use legacy Text with built-in Arial font

        if (useTMP)
        {
            // Use TextMeshPro
            TextMeshProUGUI tmpText = textGO.AddComponent<TextMeshProUGUI>();
            tmpText.text = sceneName;
            tmpText.fontSize = 60;
            tmpText.color = Color.white;
            tmpText.alignment = TextAlignmentOptions.Center;

            // Set RectTransform to fill screen
            RectTransform rectTransform = textGO.GetComponent<RectTransform>();
            rectTransform.anchorMin = new Vector2(0, 0);
            rectTransform.anchorMax = new Vector2(1, 1);
            rectTransform.offsetMin = Vector2.zero;
            rectTransform.offsetMax = Vector2.zero;
        }
        else
        {
            // Use legacy Text
            UnityEngine.UI.Text text = textGO.AddComponent<UnityEngine.UI.Text>();
            text.text = sceneName;
            text.fontSize = 60;
            text.color = Color.white;
            text.alignment = TextAnchor.MiddleCenter;
            text.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");

            // Set RectTransform to fill screen
            RectTransform rectTransform = textGO.GetComponent<RectTransform>();
            rectTransform.anchorMin = new Vector2(0, 0);
            rectTransform.anchorMax = new Vector2(1, 1);
            rectTransform.offsetMin = Vector2.zero;
            rectTransform.offsetMax = Vector2.zero;
        }

        // Create Bridge GameObject
        GameObject bridgeGO = new GameObject("Bridge");
        bridgeGO.AddComponent<StateBridge>();

        // Add EventSystem if it doesn't exist
        if (GameObject.FindObjectOfType<UnityEngine.EventSystems.EventSystem>() == null)
        {
            GameObject eventSystemGO = new GameObject("EventSystem");
            eventSystemGO.AddComponent<UnityEngine.EventSystems.EventSystem>();
            eventSystemGO.AddComponent<UnityEngine.EventSystems.StandaloneInputModule>();
        }

        // Save scene
        string scenePath = $"Assets/Scenes/{sceneName}.unity";
        EditorSceneManager.SaveScene(newScene, scenePath);

        Debug.Log($"Created scene: {scenePath}");
    }

    static void AddScenesToBuildSettings()
    {
        List<EditorBuildSettingsScene> editorBuildSettingsScenes = new List<EditorBuildSettingsScene>();

        // Add existing scenes
        foreach (EditorBuildSettingsScene scene in EditorBuildSettings.scenes)
        {
            editorBuildSettingsScenes.Add(scene);
        }

        // Add new scenes
        int addedCount = 0;
        foreach (string sceneName in SCENE_NAMES)
        {
            string scenePath = $"Assets/Scenes/{sceneName}.unity";

            // Check if scene exists
            if (!System.IO.File.Exists(scenePath))
            {
                Debug.LogWarning($"Scene not found: {scenePath}. Run 'Generate All Scenes' first.");
                continue;
            }

            // Check if already in build settings
            bool alreadyAdded = false;
            foreach (EditorBuildSettingsScene existing in editorBuildSettingsScenes)
            {
                if (existing.path == scenePath)
                {
                    alreadyAdded = true;
                    break;
                }
            }

            if (!alreadyAdded)
            {
                editorBuildSettingsScenes.Add(new EditorBuildSettingsScene(scenePath, true));
                addedCount++;
                Debug.Log($"Added to build settings: {scenePath}");
            }
        }

        // Update build settings
        EditorBuildSettings.scenes = editorBuildSettingsScenes.ToArray();

        if (addedCount > 0)
        {
            Debug.Log($"Added {addedCount} scenes to build settings!");
            EditorUtility.DisplayDialog("Success", $"Added {addedCount} scenes to build settings.", "OK");
        }
        else
        {
            EditorUtility.DisplayDialog("Info", "All scenes are already in build settings.", "OK");
        }
    }
}
