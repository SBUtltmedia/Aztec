using UnityEngine;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine.SceneManagement;
using TMPro;
using System.Collections.Generic;
using System.IO;
using System.Text.RegularExpressions;

/// <summary>
/// Automatically generates Unity scenes that match Twine passage names.
/// Passage names are discovered by parsing a .twee source file — no hardcoded list needed.
/// Each scene includes a Bridge GameObject and visual feedback showing the scene name.
/// </summary>
public class SceneGenerator : EditorWindow
{
    private string _tweePath = "";
    private List<string> _discoveredPassages = new List<string>();

    // Passages that should never become scenes (utility/metadata passages)
    private static readonly HashSet<string> EXCLUDED_PASSAGES = new HashSet<string>
    {
        "StoryTitle", "StoryData", "Story Stylesheet", "Story JavaScript",
        "StoryInit", "StoryMenu", "StoryCaption", "StoryBanner", "StoryShare",
        "StorySettings", "PassageDone", "PassageHeader", "PassageFooter"
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

        // .twee file picker
        GUILayout.Label("Step 1: Select your .twee source file", EditorStyles.boldLabel);
        GUILayout.BeginHorizontal();
        _tweePath = GUILayout.TextField(_tweePath);
        if (GUILayout.Button("Browse", GUILayout.Width(70)))
        {
            string path = EditorUtility.OpenFilePanel("Select .twee file", "Assets", "twee");
            if (!string.IsNullOrEmpty(path))
            {
                _tweePath = path;
                _discoveredPassages = ParsePassageNames(_tweePath);
            }
        }
        GUILayout.EndHorizontal();

        if (GUILayout.Button("Refresh Passages from File"))
        {
            if (!string.IsNullOrEmpty(_tweePath) && File.Exists(_tweePath))
                _discoveredPassages = ParsePassageNames(_tweePath);
            else
                EditorUtility.DisplayDialog("Error", "Please select a valid .twee file first.", "OK");
        }

        GUILayout.Space(10);

        // Show discovered passages
        if (_discoveredPassages.Count > 0)
        {
            GUILayout.Label($"Step 2: Found {_discoveredPassages.Count} passages to generate:", EditorStyles.boldLabel);
            foreach (string name in _discoveredPassages)
                GUILayout.Label("  • " + name);

            GUILayout.Space(10);
            GUILayout.Label("Each scene will include:");
            GUILayout.Label("  • Canvas with scene name text");
            GUILayout.Label("  • Bridge GameObject with StateBridge component");
            GUILayout.Space(10);

            if (GUILayout.Button("Generate All Scenes", GUILayout.Height(40)))
                GenerateAllScenes(_discoveredPassages);

            GUILayout.Space(5);
            if (GUILayout.Button("Add All Scenes to Build Settings", GUILayout.Height(30)))
                AddScenesToBuildSettings(_discoveredPassages);
        }
        else
        {
            EditorGUILayout.HelpBox("Select a .twee file and click Refresh to discover passages.", MessageType.Info);
        }
    }

    /// <summary>
    /// Parse a .twee file and return all passage names, excluding SugarCube metadata passages.
    /// Passage lines follow the format: :: PassageName [optional tags] { optional json }
    /// </summary>
    static List<string> ParsePassageNames(string tweePath)
    {
        var names = new List<string>();
        var passageHeader = new Regex(@"^::\s+(.+?)(?:\s+\[.*?\])?(?:\s+\{.*?\})?\s*$");

        foreach (string line in File.ReadLines(tweePath))
        {
            var match = passageHeader.Match(line);
            if (match.Success)
            {
                string name = match.Groups[1].Value.Trim();
                if (!EXCLUDED_PASSAGES.Contains(name))
                    names.Add(name);
            }
        }

        return names;
    }

    static void GenerateAllScenes(List<string> sceneNames)
    {
        if (!AssetDatabase.IsValidFolder("Assets/Scenes"))
            AssetDatabase.CreateFolder("Assets", "Scenes");

        if (!AssetDatabase.IsValidFolder("Assets/Resources"))
            AssetDatabase.CreateFolder("Assets", "Resources");

        string gameStatePath = "Assets/Resources/GameState.asset";
        GameStateSO gameState = AssetDatabase.LoadAssetAtPath<GameStateSO>(gameStatePath);
        if (gameState == null)
        {
            gameState = ScriptableObject.CreateInstance<GameStateSO>();
            AssetDatabase.CreateAsset(gameState, gameStatePath);
            AssetDatabase.SaveAssets();
            Debug.Log("Created new GameState asset in Assets/Resources/");
        }

        foreach (string sceneName in sceneNames)
            CreateScene(sceneName, gameState);

        Debug.Log($"Successfully generated {sceneNames.Count} scenes!");
        EditorUtility.DisplayDialog("Success", $"Generated {sceneNames.Count} scenes in Assets/Scenes/", "OK");
    }

    static void CreateScene(string sceneName, GameStateSO gameState)
    {
        Scene newScene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);

        GameObject cameraGO = new GameObject("Main Camera");
        Camera camera = cameraGO.AddComponent<Camera>();
        camera.clearFlags = CameraClearFlags.SolidColor;
        camera.backgroundColor = Color.black;
        cameraGO.tag = "MainCamera";

        GameObject canvasGO = new GameObject("Canvas");
        Canvas canvas = canvasGO.AddComponent<Canvas>();
        canvas.renderMode = RenderMode.ScreenSpaceOverlay;
        canvasGO.AddComponent<UnityEngine.UI.CanvasScaler>();
        canvasGO.AddComponent<UnityEngine.UI.GraphicRaycaster>();

        GameObject textGO = new GameObject("SceneNameText");
        textGO.transform.SetParent(canvasGO.transform);
        UnityEngine.UI.Text text = textGO.AddComponent<UnityEngine.UI.Text>();
        text.text = sceneName;
        text.fontSize = 60;
        text.color = Color.white;
        text.alignment = TextAnchor.MiddleCenter;
        text.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
        RectTransform rectTransform = textGO.GetComponent<RectTransform>();
        rectTransform.anchorMin = new Vector2(0, 0);
        rectTransform.anchorMax = new Vector2(1, 1);
        rectTransform.offsetMin = Vector2.zero;
        rectTransform.offsetMax = Vector2.zero;

        GameObject bridgeGO = new GameObject("Bridge");
        StateBridge bridge = bridgeGO.AddComponent<StateBridge>();
        bridge.gameState = gameState;

        if (GameObject.FindObjectOfType<UnityEngine.EventSystems.EventSystem>() == null)
        {
            GameObject eventSystemGO = new GameObject("EventSystem");
            eventSystemGO.AddComponent<UnityEngine.EventSystems.EventSystem>();
            eventSystemGO.AddComponent<UnityEngine.EventSystems.StandaloneInputModule>();
        }

        string scenePath = $"Assets/Scenes/{sceneName}.unity";
        EditorSceneManager.SaveScene(newScene, scenePath);
        Debug.Log($"Created scene: {scenePath}");
    }

    static void AddScenesToBuildSettings(List<string> sceneNames)
    {
        var editorBuildSettingsScenes = new List<EditorBuildSettingsScene>(EditorBuildSettings.scenes);

        int addedCount = 0;
        foreach (string sceneName in sceneNames)
        {
            string scenePath = $"Assets/Scenes/{sceneName}.unity";

            if (!File.Exists(scenePath))
            {
                Debug.LogWarning($"Scene not found: {scenePath}. Run 'Generate All Scenes' first.");
                continue;
            }

            bool alreadyAdded = false;
            foreach (EditorBuildSettingsScene existing in editorBuildSettingsScenes)
            {
                if (existing.path == scenePath) { alreadyAdded = true; break; }
            }

            if (!alreadyAdded)
            {
                editorBuildSettingsScenes.Add(new EditorBuildSettingsScene(scenePath, true));
                addedCount++;
                Debug.Log($"Added to build settings: {scenePath}");
            }
        }

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
