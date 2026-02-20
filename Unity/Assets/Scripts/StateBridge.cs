using UnityEngine;
using System.Runtime.InteropServices;
using Newtonsoft.Json;
using System;

/// <summary>
/// StateBridge: The "Receiver" component that sits in your scene.
/// It gets data from the browser and pumps it into the GameState ScriptableObject.
/// </summary>
public class StateBridge : MonoBehaviour
{
    [Header("Configuration")]
    [Tooltip("Drag the GameState asset here to have it updated automatically.")]
    public GameStateSO gameState;

    // =========================================================================
    // External JavaScript functions (WebGL only)
    // =========================================================================

    [DllImport("__Internal")]
    private static extern void InitMessageListener();

    [DllImport("__Internal")]
    private static extern void SendStateUpdate(string variable, string valueJson);

    [DllImport("__Internal")]
    private static extern void SendAtomicUpdate(string variable, string operation, string valueJson);

    void Start()
    {
        if (gameState == null)
        {
            Debug.LogError("[StateBridge] No GameState ScriptableObject assigned!");
        }

        #if !UNITY_EDITOR && UNITY_WEBGL
        InitMessageListener();
        #endif
    }

    /// <summary>
    /// Called automatically by the JavaScript bridge via SendMessage.
    /// </summary>
    public void ReceiveState(string jsonState)
    {
        if (gameState != null)
        {
            gameState.UpdateFromJSON(jsonState);
        }
    }

    /// <summary>
    /// Called automatically by the JavaScript bridge when the Twine passage changes.
    /// Silently skips if no matching scene is in Build Settings (e.g. utility passages).
    /// </summary>
    public void ReceiveSceneChange(string sceneName)
    {
        // Check if scene exists in Build Settings before attempting to load
        bool sceneExists = false;
        for (int i = 0; i < UnityEngine.SceneManagement.SceneManager.sceneCountInBuildSettings; i++)
        {
            string path = UnityEngine.SceneManagement.SceneUtility.GetScenePathByBuildIndex(i);
            string name = System.IO.Path.GetFileNameWithoutExtension(path);
            if (name == sceneName)
            {
                sceneExists = true;
                break;
            }
        }

        if (sceneExists)
        {
            Debug.Log($"[StateBridge] Loading scene: {sceneName}");
            UnityEngine.SceneManagement.SceneManager.LoadScene(sceneName);
        }
        else
        {
            Debug.LogWarning($"[StateBridge] Scene '{sceneName}' not in Build Settings — skipping.");
        }
    }

    // =========================================================================
    // WRITER API: Send state changes back to the server
    // =========================================================================

    public void ThSet(string variable, object value)
    {
        #if !UNITY_EDITOR && UNITY_WEBGL
        string valueJson = JsonConvert.SerializeObject(value);
        SendStateUpdate(variable, valueJson);
        #else
        Debug.Log($"[Mock Sync] {variable} = {value}");
        #endif
    }

    public void ThAdd(string variable, float amount)
    {
        #if !UNITY_EDITOR && UNITY_WEBGL
        string valueJson = JsonConvert.SerializeObject(amount);
        SendAtomicUpdate(variable, "add", valueJson);
        #else
        Debug.Log($"[Mock Sync] {variable} += {amount}");
        #endif
    }
}
