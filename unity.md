Project Guide: Twine/SugarCube + Unity/ECS Integration
This document describes a complete, scalable architecture for integrating a Twine (SugarCube) story directly with a Unity (WebGL) application.
The core of this project is based on a Model-View-Controller (MVC) pattern:
Model: The SugarCube.State object. This is the single source of truth for all narrative data (e.g., $playerHealth, $hasKey, $currentPassage).
View: The Unity (WebGL) application. It renders a 2D or 3D visual representation of the Model and captures game-world inputs (clicks, triggers).
Controller: The SugarCube passages and logic. Passages are "events" or "methods" that receive commands (from Unity or the player) and update the Model.



Shutterstock
1. Core Architecture Flow
This system is event-driven. The "View" (Unity) never directly modifies the "Model" (SugarCube State). It sends commands to the "Controller" (SugarCube Passages), which then updates the Model. The Model then automatically notifies the View of the change.
A) Unity to SugarCube (Command)
The player clicks a 3D object in the Unity View (e.g., a statue).
This object has a TwineLinkTrigger.cs component on it.
The component's OnMouseDown() function fires, grabbing the passageName (e.g., "Quetzalcoatl") from its inspector field.
It calls the static C# wrapper: UnityToSugarCube.SendCommand("Quetzalcoatl").
A .jslib file (the "wire") receives this call and executes window.SugarCube.Engine.play("Quetzalcoatl").
SugarCube (Controller) runs the :: Quetzalcoatl passage.
This passage's logic (e.g., <<set $god_favor += 1>>) updates the SugarCube.State (Model).
B) SugarCube to Unity (State Sync)
8. Because the Model changed, SugarCube's :passagerender event fires.
9. Our Story JavaScript (the "wire") catches this event.
10. It serializes the entire SugarCube.State (passage name + all variables) into a single JSON string.
11. It sends this JSON to Unity: window.unityInstance.SendMessage("UnityStateReceiver", "OnStateUpdated", jsonPayload).
12. A UnityStateReceiver.cs script (View) in the scene receives the JSON.
13. It deserializes the JSON into C# objects.
14. It calls two systems:
* PassageAssetManager.ActivatePassage(passageName): This looks up a ScriptableObject matching the passage name and spawns associated assets (prefabs, audio).
* ECSSyncSystem.UpdateWorldState(variables): This updates all relevant ECS components (e.g., Health, Inventory) to match the new Model.
15. The Unity scene visually updates to reflect the new state.
2. Required Files & Code
Here is all the code you need to build the project, organized by file.
Part A: Folder Structure
Create this folder structure in your Unity Assets/ directory:
Assets/
├── Editor/
├── Narrative/
│   ├── PassageAssets/  (This will be auto-populated)
│   └── Twine/          (Place your compiled .html file here)
├── Plugins/
│   └── WebGL/
└── Scripts/
    ├── Bridge/
    └── Narrative/



Part B: The Bridge Code (The "Wires")
These files handle the C# $\leftrightarrow$ JavaScript communication.
<details>
<summary><b><code>Assets/Plugins/WebGL/SugarCubeBridge.jslib</code></b></summary>
// SugarCubeBridge.jslib
// This file allows C# to call directly into the SugarCube JavaScript API.
// It assumes the SugarCube story is running in the same browser window.

mergeInto(LibraryManager.library, {

  /**
   * Tells the SugarCube engine to navigate to a specific passage.
   * This is the primary way for Unity (the View) to send a
   * command to the SugarCube (the Controller).
   *
   * C# Call: GoToSugarCubePassage("PlayerClickedNPC");
   */
  GoToSugarCubePassage: function(passageNamePtr) {
    var passageName = UTF8ToString(passageNamePtr);

    if (window.SugarCube && window.SugarCube.Engine) {
      try {
        // This is the "Controller" action
        window.SugarCube.Engine.play(passageName);
        console.log("Unity -> SugarCube: play(" + passageName + ")");
      } catch (e) {
        console.error("Unity -> SugarCube Error: " + e);
      }
    } else {
      console.warn("Unity -> SugarCube: SugarCube.Engine API not found.");
    }
  }
});



</details>
<details>
<summary><b><code>Assets/Scripts/Bridge/UnityToSugarCube.cs</code></b></summary>
// UnityToSugarCube.cs
// This is a static C# wrapper to make calling the .jslib functions easy.
using System.Runtime.InteropServices;
using UnityEngine;

public static class UnityToSugarCube
{
    // Imports the "GoToSugarCubePassage" function from the .jslib file
    [DllImport("__Internal")]
    private static extern void GoToSugarCubePassage(string passageName);

    /// <summary>
    /// Sends a "command" from the Unity View to the SugarCube Controller
    /// by telling it to play a passage.
    /// </summary>
    public static void SendCommand(string passageName)
    {
        // Jslib functions only work in WebGL builds.
        // This check prevents errors in the Unity Editor.
        #if !UNITY_EDITOR && UNITY_WEBGL
            GoToSugarCubePassage(passageName);
        #else
            Debug.Log($"[Editor] Command to SugarCube: play({passageName})");
        #endif
    }
}



</details>
<details>
<summary><b><code>Assets/Scripts/Bridge/TwineLinkTrigger.cs</code></b> (NEW FILE)</summary>
// TwineLinkTrigger.cs
using UnityEngine;

/// <summary>
/// This component "maps" a Unity GameObject to a Twine passage.
/// When this object is clicked, it sends a command to SugarCube
/// to play the specified passage.
///
/// REQUIRES: A Collider component (e.g., BoxCollider) on this GameObject.
/// </summary>
[AddComponentMenu("Narrative/Twine Link Trigger")]
[RequireComponent(typeof(Collider))] // Ensures this object can be clicked
public class TwineLinkTrigger : MonoBehaviour
{
    [Header("Twine Link")]
    [Tooltip("The exact name of the passage to play when this object is clicked.")]
    public string passageName;

    /// <summary>
    /// This is a built-in Unity message that fires when
    /// a Collider on this GameObject is clicked by the mouse.
    /// </summary>
    private void OnMouseDown()
    {
        if (string.IsNullOrEmpty(passageName))
        {
            Debug.LogWarning($"This TwineLinkTrigger on '{gameObject.name}' has no passageName set.", this);
            return;
        }

        // This is it! This is the "click event" mapping.
        // We call the bridge function we already defined.
        Debug.Log($"Clicked on '{gameObject.name}', sending command to play passage: [[{passageName}]]");
        UnityToSugarCube.SendCommand(passageName);
    }

    /// <summary>
    /// Optional: Draws a helper gizmo in the Scene view
    /// to show that this is an interactive narrative object.
    /// </summary>
    private void OnDrawGizmos()
    {
        // Draw a purple sphere to indicate it's a narrative link
        Gizmos.color = new Color(0.6f, 0.4f, 1.0f, 0.3f);
        Gizmos.DrawSphere(transform.position, 0.5f);
        
        // Draw a label above the object
        #if UNITY_EDITOR
        UnityEditor.Handles.Label(transform.position + (Vector3.up * 0.75f), $"[[{passageName}]]");
        #endif
    }
}


</details>
<details>
<summary><b><code>Twine: Story JavaScript</code></b> (Copy this into your Twine story)</summary>
/**
 * This code block goes into your story's "Story JavaScript" section.
 *
 * This hook fires *after* a passage has been rendered and the
 * Model (SugarCube.State) is fully updated.
 */
$(document).on(':passagerender', function (ev) {
  // Check if our Unity instance (which we set in the final HTML) is ready
  if (window.unityInstance) {
    
    // 1. Get the current passage name
    var passageName = window.SugarCube.State.passage;
    
    // 2. Get all state variables
    var stateVariables = window.SugarCube.State.variables;

    // 3. Bundle them into a single payload
    var payload = {
      passage: passageName,
      variables: stateVariables
    };

    // 4. Serialize and send to Unity
    try {
      var jsonPayload = JSON.stringify(payload);
      
      // Use the modern unityInstance.SendMessage method
      window.unityInstance.SendMessage(
        "UnityStateReceiver",  // GameObject name
        "OnStateUpdated",      // Method name
        jsonPayload            // The JSON string
      );
    } catch (e) {
      console.error("SugarCube -> Unity: Failed to serialize or send payload.", e);
    }
    
  } else {
    // This warning is helpful for debugging if the Unity app isn't loaded
    console.warn("SugarCube -> Unity: unityInstance not found.");
  }
});



</details>
<details>
<summary><b><code>Assets/Scripts/Bridge/UnityStateReceiver.cs</code></b></summary>
// UnityStateReceiver.cs
// This script sits on a GameObject named "UnityStateReceiver"
// and listens for messages from SugarCube.
using UnityEngine;

// --- C# classes to match the JSON payload from SugarCube ---
// These names MUST match the JSON structure.

[System.Serializable]
public class SugarCubePayload
{
    public string passage;
    public SugarCubeVariables variables;
}

[System.Serializable]
public class SugarCubeVariables
{
    // IMPORTANT: These variable names must EXACTLY match
    // your SugarCube variables (without the $).
    // e.g., $health -> public int health;
    // e.g., $has_key -> public bool has_key;
    
    public int health;
    // ... add all other variables you want Unity to sync
}

// --- The Main Receiver Class ---

public class UnityStateReceiver : MonoBehaviour
{
    [Header("Dependencies")]
    [Tooltip("Drag the PassageAssetManager GameObject here")]
    public PassageAssetManager passageManager;
    
    // You would also have a reference to your ECSSyncSystem here
    // public ECSSyncSystem ecsSyncSystem;

    void Awake()
    {
        // Find the manager if it wasn't set in the inspector
        if (passageManager == null)
            passageManager = FindObjectOfType<PassageAssetManager>();
            
        // Make this object persist across scene loads if necessary
        // DontDestroyOnLoad(this.gameObject);
    }

    /// <summary>
    /// This method is called BY JAVASCRIPT every time a passage changes.
    /// </summary>
    public void OnStateUpdated(string jsonPayload)
    {
        Debug.Log("New state from SugarCube: " + jsonPayload);
        
        try
        {
            SugarCubePayload payload = JsonUtility.FromJson<SugarCubePayload>(jsonPayload);

            // --- 1. Delegate Passage Actions ---
            // Tell the PassageManager to activate the assets for this passage
            if (payload != null && payload.passage != null)
            {
                passageManager.ActivatePassage(payload.passage);
            }

            // --- 2. Delegate State Variable Syncing ---
            // Tell your ECS system to update components
            if (payload != null && payload.variables != null)
            {
                // ecsSyncSystem.UpdateWorldState(payload.variables);
                // (This function would update player health components,
                // inventory components, etc., based on the payload)
            }
        }
        catch (System.Exception e)
        {
            Debug.LogError($"Failed to parse JSON from SugarCube: {e.Message}");
            Debug.LogError($"Received Payload: {jsonPayload}");
        }
    }
}



</details>
Part C: The Scalable Asset System
These scripts allow you to link passages to Unity assets.
<details>
<summary><b><code>Assets/Scripts/Narrative/PassageAsset.cs</code></b> (The ScriptableObject)</summary>
// PassageAsset.cs
using UnityEngine;
using UnityEngine.Events;

[CreateAssetMenu(fileName = "NewPassageAsset", menuName = "Narrative/Passage Asset")]
public class PassageAsset : ScriptableObject
{
    [Header("Twine Link")]
    [Tooltip("The passage name from Twine (e.g., 'Start', 'SnakePit')")]
    public string passageName; // This is the "key"

    [Header("Unity Assets")]
    [Tooltip("Prefab to spawn when this passage is activated")]
    public GameObject prefabToSpawn;

    [Tooltip("Music or Ambience to play")]
    public AudioClip musicClip;

    [Tooltip("One-shot sound effect to play")]
    public AudioClip sfxClip;

    [Header("Advanced")]
    [Tooltip("A list of custom UnityEvents to run")]
    public UnityEvent OnPassageActivated;
}



</details>
<details>
<summary><b><code>Assets/Scripts/Narrative/PassageAssetManager.cs</code></b> (The Manager)</summary>
// PassageAssetManager.cs
using System.Collections.Generic;
using UnityEngine;

public class PassageAssetManager : MonoBehaviour
{
    [Tooltip("This list will be auto-populated by the Editor script")]
    public List<PassageAsset> allPassageAssets;

    // A dictionary for fast, O(1) lookups at runtime
    private Dictionary<string, PassageAsset> passageLookup;

    [Header("System References")]
    public AudioSource musicSource;
    public AudioSource sfxSource;
    // You could also have a PrefabManager, CutsceneManager, etc.

    void Awake()
    {
        // Convert the list into a dictionary for fast lookups
        passageLookup = new Dictionary<string, PassageAsset>();
        foreach (var asset in allPassageAssets)
        {
            if (asset != null && !passageLookup.ContainsKey(asset.passageName))
            {
                passageLookup.Add(asset.passageName, asset);
            }
        }
        Debug.Log($"PassageAssetManager initialized with {passageLookup.Count} assets.");
    }

    /// <summary>
    /// This is called by the UnityStateReceiver.
    /// It finds the matching asset and activates its content.
    /// </summary>
    public void ActivatePassage(string passageName)
    {
        if (passageLookup.TryGetValue(passageName, out PassageAsset asset))
        {
            Debug.Log($"Activating assets for passage: {passageName}");

            // 1. Play Music
            if (asset.musicClip != null && musicSource.clip != asset.musicClip)
            {
                musicSource.clip = asset.musicClip;
                musicSource.Play();
            }

            // 2. Play SFX
            if (asset.sfxClip != null)
            {
                sfxSource.PlayOneShot(asset.sfxClip);
            }

            // 3. Spawn Prefab
            if (asset.prefabToSpawn != null)
            {
                // You'll want a more robust spawning system,
                // but this is the basic idea.
                Instantiate(asset.prefabToSpawn, Vector3.zero, Quaternion.identity);
            }

            // 4. Fire any custom events
            if (asset.OnPassageActivated != null)
            {
                asset.OnPassageActivated.Invoke();
            }
        }
        else
        {
            Debug.LogWarning($"No PassageAsset found for passage: {passageName}");
        }
    }
}



</details>
Part D: The Automated Editor Workflow
These scripts automate the creation of your 330+ PassageAsset files.
<details>
<summary><b><code>Assets/Editor/PassageAssetGenerator.cs</code></b></summary>
// Assets/Editor/PassageAssetGenerator.cs
using UnityEngine;
using UnityEditor;
using System.IO;
using System.Text.RegularExpressions;
using System.Collections.Generic;
using System.Xml; // We'll use this for robust parsing

public class PassageAssetGenerator
{
    // Define the folder where your assets will be created
    private const string OUTPUT_FOLDER = "Assets/Narrative/PassageAssets";

    // This adds a menu item at the top of the Unity Editor
    [MenuItem("Assets/Narrative/Generate Passage Assets from Twine HTML", false, 10)]
    private static void GenerateAssets()
    {
        // Get the .html file the user has selected in the Project window
        TextAsset htmlFile = Selection.activeObject as TextAsset;
        if (htmlFile == null || !AssetDatabase.GetAssetPath(htmlFile).EndsWith(".html"))
        {
            EditorUtility.DisplayDialog("Error", "Please select your compiled Twine .html file in the Project window.", "OK");
            return;
        }

        string htmlContent = htmlFile.text;

        // Ensure the output directory exists
        if (!Directory.Exists(OUTPUT_FOLDER))
        {
            Directory.CreateDirectory(OUTPUT_FOLDER);
        }

        // 1. Find all passage names from the <tw-storydata> tag
        var twinePassageNames = new HashSet<string>();
        try
        {
            // Find the <tw-storydata> tag
            Match storyDataMatch = Regex.Match(htmlContent, @"<tw-storydata[\s\S]*?</tw-storydata>");
            if (!storyDataMatch.Success)
            {
                throw new System.Exception("Could not find <tw-storydata> tag in the HTML file.");
            }

            string storyDataContent = storyDataMatch.Value;

            // Use Regex to find all <tw-passagedata ... name="..." ...> tags
            // This is safer than full XML parsing on potentially malformed HTML
            MatchCollection passageMatches = Regex.Matches(storyDataContent, @"<tw-passagedata[\s\S]*?name=""([^""]*)""[\s\S]*?>");

            foreach (Match match in passageMatches)
            {
                string cleanName = match.Groups[1].Value.Trim();
                if (!string.IsNullOrEmpty(cleanName))
                {
                    // The HTML parser might decode special characters, so we unescape them
                    // e.g., 'Level 1 > 2' becomes 'Level 1 > 2'
                    twinePassageNames.Add(System.Net.WebUtility.HtmlDecode(cleanName));
                }
            }
        }
        catch (System.Exception e)
        {
            EditorUtility.DisplayDialog("Error", $"Failed to parse Twine HTML file. Is this a valid SugarCube 2 HTML file?\n\nError: {e.Message}", "OK");
            return;
        }

        Debug.Log($"Found {twinePassageNames.Count} unique passage names in {htmlFile.name}.");

        // 2. Find all existing PassageAsset files to avoid duplicates
        var existingAssets = new Dictionary<string, PassageAsset>();
        string[] guids = AssetDatabase.FindAssets($"t:{typeof(PassageAsset).Name}", new[] { OUTPUT_FOLDER });
        foreach (string guid in guids)
        {
            string path = AssetDatabase.GUIDToAssetPath(guid);
            PassageAsset asset = AssetDatabase.LoadAssetAtPath<PassageAsset>(path);
            if (asset != null && !string.IsNullOrEmpty(asset.passageName) && !existingAssets.ContainsKey(asset.passageName))
            {
                existingAssets.Add(asset.passageName, asset);
            }
        }

        // 3. Create any assets that are missing
        int newAssetsCreated = 0;
        foreach (string passageName in twinePassageNames)
        {
            if (!existingAssets.ContainsKey(passageName))
            {
                // This passage exists in Twine but not in Unity. Create it.
                PassageAsset newAsset = ScriptableObject.CreateInstance<PassageAsset>();
                newAsset.passageName = passageName;

                // Sanitize the passage name to be a valid file name
                string safeName = string.Join("_", passageName.Split(Path.GetInvalidFileNameChars()));
                string assetPath = Path.Combine(OUTPUT_FOLDER, $"{safeName}.asset");
                
                // Ensure the file name is unique
                assetPath = AssetDatabase.GenerateUniqueAssetPath(assetPath);

                AssetDatabase.CreateAsset(newAsset, assetPath);
                newAssetsCreated++;
            }
        }

        AssetDatabase.SaveAssets();
        AssetDatabase.Refresh();

        EditorUtility.DisplayDialog("Success", $"Generation complete!\n\nFound: {twinePassageNames.Count} passages\nCreated: {newAssetsCreated} new assets\nExisting: {existingAssets.Count} assets", "OK");
    }
}



</details>
<details>
<summary><b><code>Assets/Editor/PassageManagerPopulator.cs</code></b></summary>
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



</details>
3. Step-by-Step Workflow (Updated)
Project Setup:
Create a new Unity project (URP or 3D).
Create all 9 C# and .jslib files from this document in their correct folders.
Scene Setup:
Create a new scene.
Create an empty GameObject named GameManager.
Add the PassageAssetManager.cs script to it.
Add two AudioSource components to GameManager (one for music, one for SFX). Drag them onto the musicSource and sfxSource slots on the manager.
Create an empty GameObject named exactly UnityStateReceiver.
Add the UnityStateReceiver.cs script to it.
Drag the GameManager GameObject onto the passageManager slot of the UnityStateReceiver.
Save this scene.
Twine Setup:
Open your Twine project.
Copy the Story JavaScript code (from Part B) into your story's JavaScript section.
Publish your story to an .html file (e.g., Aztec.html). This compiled file is what Unity will read.
Run Automation:
Drag your compiled Aztec.html file into the Assets/Narrative/Twine/ folder in Unity.
In the Unity Project window, click on Aztec.html.
Go to the top menu: Assets $\rightarrow$ Narrative $\rightarrow$ Generate Passage Assets from Twine HTML. Wait for the "Success" popup.
In the Hierarchy, click on your GameManager GameObject.
Go to the top menu: GameObject $\rightarrow$ Narrative $\rightarrow$ Populate Passage Asset Manager.
Verify & Add Content:
Click on your GameManager. Its All Passage Assets list should now be full.
Go to the Assets/Narrative/PassageAssets/ folder. Find an asset (e.g., Start.asset).
Click it. In the Inspector, drag a music clip onto the Music Clip slot.
(NEW) Map Click Events in Unity:
In your Unity scene, create a 3D object, like a Cube. This will represent your "Quetzalcoatl" statue.
Ensure the Cube has a Box Collider component on it (this is required for OnMouseDown to work).
Add the TwineLinkTrigger.cs component to the Cube.
In the Inspector, find the Passage Name field on your Twine Link Trigger component.
Type in the exact name of the passage you want to trigger, e.g., Quetzalcoatl.
Now, when you run the game, clicking this Cube will send a command to SugarCube to play the :: Quetzalcoatl passage.
Build & Run (The Final Combination):
From Unity: Go to File $\rightarrow$ Build Settings. Select WebGL and Build. This will create a Build/ folder and TemplateData/ folder.
From Twine: You should already have your Aztec.html file (or index.html) from Step 3.
Combine:
Create a new, empty folder (e.g., MyFinalGame).
Copy your Twine Aztec.html into MyFinalGame. Rename it to index.html.
Copy the Build/ and TemplateData/ folders from your Unity build into MyFinalGame.
Edit the index.html (formerly Aztec.html):
Open MyFinalGame/index.html in a text editor.
In the <head>, add a link to the Unity loader script (find the </head> tag and add this just before it):
<!-- Add this right before the closing </head> tag -->
<script src="Build/UnityLoader.js"></script>


In the <body>, find where you want the Unity canvas to appear. The SugarCube sidebar (<div id="ui-bar">...</div>) is a good place. Add the canvas container:
<!-- Add this inside the #ui-bar div, or wherever you want the canvas -->
<div id="unity-container" style="width: 100%; height: 400px; border: 1px solid #444;">
    <canvas id="unity-canvas" style="width: 100%; height: 100%;"></canvas>
</div>


At the very bottom of the <body> tag (just before </body>), add the Unity initialization script:
<!-- Add this at the VERY end of the <body> -->
<script>
  var canvas = document.querySelector("#unity-canvas");

  // --- IMPORTANT ---
  // Find the exact name of your .json file inside the Build/ folder!
  // e.g., "MyUnityBuild.json", "WebGL.json"
  var loaderUrl = "Build/YourUnityBuildName.json"; 

  var config = {
    dataUrl: loaderUrl.replace(".json", ".data.unityweb"),
    frameworkUrl: loaderUrl.replace(".json", ".framework.js.unityweb"),
    codeUrl: loaderUrl.replace(".json", ".wasm.unityweb"),
    streamingAssetsUrl: "StreamingAssets",
    companyName: "YourCompany",
    productName: "YourGame",
    productVersion: "1.0",
  };

  // This global variable is used by our bridges
  var unityInstance = null; 

  createUnityInstance(canvas, config, (progress) => {
    // You can make a custom loading bar here
    // console.log("Unity Loading: " + (progress * 100) + "%");
  }).then((instance) => {
    unityInstance = instance; // Store the instance for our bridges to use
    console.log("Unity instance loaded successfully!");
  }).catch((message) => {
    // Handle errors
    alert(message);
  });
</script>


Test: Host this MyFinalGame folder on a simple web server (you can't run it from a local file:// URL due to browser security). When you play your Twine story, the Unity canvas should load. When you click the Cube in the Unity view, the SugarCube story should navigate to the :: Quetzalcoatl passage.
