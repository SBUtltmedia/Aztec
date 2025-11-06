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
