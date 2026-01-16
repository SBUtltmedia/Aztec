using UnityEngine;
using System.Runtime.InteropServices;
using System.Collections.Generic;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;

/// <summary>
/// StateBridge: Bidirectional communication between Unity and the Twine/Socket.IO multiplayer system.
///
/// RECEIVING STATE:
///   - Variables dictionary is automatically updated when Twine sends state
///   - Use GetVar<T>("variableName") to access values
///   - Subscribe to OnStateReceived event for notifications
///
/// SENDING STATE (equivalent to Twine's <<th-set>>):
///   - ThSet("$variableName", value)        // Absolute assignment (like <<th-set '$var' to value>>)
///   - ThAdd("$variableName", amount)       // Atomic add (like <<th-set '$var' += amount>>)
///   - ThSubtract("$variableName", amount)  // Atomic subtract (like <<th-set '$var' -= amount>>)
/// </summary>
public class StateBridge : MonoBehaviour
{
    /// <summary>
    /// Current state variables received from the server.
    /// Updated automatically when Twine sends STATE_UPDATE messages.
    /// </summary>
    public static Dictionary<string, object> Variables = new Dictionary<string, object>();

    /// <summary>
    /// Event fired whenever state is received from the server.
    /// Subscribe to this to react to state changes.
    /// </summary>
    public static event Action<Dictionary<string, object>> OnStateReceived;

    /// <summary>
    /// The raw JObject of the last received state (for nested access).
    /// </summary>
    public static JObject RawState { get; private set; }

    // For display in the demo
    private string debugText = "Waiting for SugarCube data...";
    private string lastStrength = "N/A";

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
        #if !UNITY_EDITOR && UNITY_WEBGL
        InitMessageListener();
        debugText = "Bridge Initialized. Listening...";
        #endif
    }

    public void ReceiveState(string jsonState)
    {
        try
        {
            Variables = JsonConvert.DeserializeObject<Dictionary<string, object>>(jsonState);
            RawState = JObject.Parse(jsonState);
            debugText = $"Received {Variables.Count} root variables.";

            // Fire the event so other scripts can react
            OnStateReceived?.Invoke(Variables);

            // Attempt to parse specific nested path: $user[userId].stats.strength
            if (Variables.ContainsKey("user") && Variables.ContainsKey("userId"))
            {
                string currentUserId = RawState["userId"].ToString();

                // Navigate via JTokens: user -> [userId] -> stats -> strength
                JToken userToken = RawState["user"][currentUserId];

                if (userToken != null)
                {
                    JToken strengthToken = userToken.SelectToken("stats.strength");

                    if (strengthToken != null)
                    {
                        lastStrength = strengthToken.ToString();
                        debugText += $"\nUser [{currentUserId}] Strength: {lastStrength}";
                    }
                    else
                    {
                        debugText += $"\nStats found, but strength missing for user {currentUserId}";
                    }
                }
                else
                {
                    debugText += $"\nUser {currentUserId} not found in 'user' object.";
                }
            }
        }
        catch (Exception e)
        {
            debugText = "Error parsing: " + e.Message;
            Debug.LogError(debugText);
        }
    }

    // =========================================================================
    // OUTBOUND: Send state changes to the server (equivalent to <<th-set>>)
    // =========================================================================

    /// <summary>
    /// Set a shared variable on the server (equivalent to Twine's <<th-set '$var' to value>>).
    /// This uses "last write wins" semantics.
    /// </summary>
    /// <param name="variable">Variable path with $ prefix, e.g., "$sharedCounter" or "$users[$userId].score"</param>
    /// <param name="value">The value to set (will be JSON serialized)</param>
    public static void ThSet(string variable, object value)
    {
        // Update local state optimistically
        string varName = variable.TrimStart('$');
        Variables[varName] = value;

        #if !UNITY_EDITOR && UNITY_WEBGL
        string valueJson = JsonConvert.SerializeObject(value);
        SendStateUpdate(variable, valueJson);
        #else
        Debug.Log($"[StateBridge.ThSet] {variable} = {value} (WebGL only - no server sync in Editor)");
        #endif
    }

    /// <summary>
    /// Atomically add to a shared variable (equivalent to Twine's <<th-set '$var' += amount>>).
    /// Atomic operations prevent race conditions when multiple clients update simultaneously.
    /// </summary>
    public static void ThAdd(string variable, float amount)
    {
        // Update local state optimistically
        string varName = variable.TrimStart('$');
        if (Variables.ContainsKey(varName) && Variables[varName] is IConvertible)
        {
            float current = Convert.ToSingle(Variables[varName]);
            Variables[varName] = current + amount;
        }

        #if !UNITY_EDITOR && UNITY_WEBGL
        string valueJson = JsonConvert.SerializeObject(amount);
        SendAtomicUpdate(variable, "add", valueJson);
        #else
        Debug.Log($"[StateBridge.ThAdd] {variable} += {amount} (WebGL only - no server sync in Editor)");
        #endif
    }

    /// <summary>
    /// Atomically subtract from a shared variable (equivalent to Twine's <<th-set '$var' -= amount>>).
    /// </summary>
    public static void ThSubtract(string variable, float amount)
    {
        string varName = variable.TrimStart('$');
        if (Variables.ContainsKey(varName) && Variables[varName] is IConvertible)
        {
            float current = Convert.ToSingle(Variables[varName]);
            Variables[varName] = current - amount;
        }

        #if !UNITY_EDITOR && UNITY_WEBGL
        string valueJson = JsonConvert.SerializeObject(amount);
        SendAtomicUpdate(variable, "subtract", valueJson);
        #else
        Debug.Log($"[StateBridge.ThSubtract] {variable} -= {amount} (WebGL only - no server sync in Editor)");
        #endif
    }

    /// <summary>
    /// Atomically multiply a shared variable (equivalent to Twine's <<th-set '$var' *= amount>>).
    /// </summary>
    public static void ThMultiply(string variable, float amount)
    {
        string varName = variable.TrimStart('$');
        if (Variables.ContainsKey(varName) && Variables[varName] is IConvertible)
        {
            float current = Convert.ToSingle(Variables[varName]);
            Variables[varName] = current * amount;
        }

        #if !UNITY_EDITOR && UNITY_WEBGL
        string valueJson = JsonConvert.SerializeObject(amount);
        SendAtomicUpdate(variable, "multiply", valueJson);
        #else
        Debug.Log($"[StateBridge.ThMultiply] {variable} *= {amount} (WebGL only - no server sync in Editor)");
        #endif
    }

    /// <summary>
    /// Atomically divide a shared variable (equivalent to Twine's <<th-set '$var' /= amount>>).
    /// </summary>
    public static void ThDivide(string variable, float amount)
    {
        string varName = variable.TrimStart('$');
        if (Variables.ContainsKey(varName) && Variables[varName] is IConvertible)
        {
            float current = Convert.ToSingle(Variables[varName]);
            Variables[varName] = current / amount;
        }

        #if !UNITY_EDITOR && UNITY_WEBGL
        string valueJson = JsonConvert.SerializeObject(amount);
        SendAtomicUpdate(variable, "divide", valueJson);
        #else
        Debug.Log($"[StateBridge.ThDivide] {variable} /= {amount} (WebGL only - no server sync in Editor)");
        #endif
    }

    // =========================================================================
    // Helper methods for reading state
    // =========================================================================

    /// <summary>
    /// Get a variable value with type conversion.
    /// </summary>
    /// <typeparam name="T">The expected type</typeparam>
    /// <param name="variableName">Variable name without $ prefix</param>
    /// <param name="defaultValue">Value to return if not found</param>
    public static T GetVar<T>(string variableName, T defaultValue = default)
    {
        if (Variables.TryGetValue(variableName, out object value))
        {
            try
            {
                if (value is T typedValue)
                    return typedValue;

                // Try conversion
                return (T)Convert.ChangeType(value, typeof(T));
            }
            catch
            {
                return defaultValue;
            }
        }
        return defaultValue;
    }

    /// <summary>
    /// Get a nested value using JSON path (e.g., "users.alice.score").
    /// </summary>
    public static T GetNestedVar<T>(string jsonPath, T defaultValue = default)
    {
        if (RawState == null) return defaultValue;

        try
        {
            JToken token = RawState.SelectToken(jsonPath);
            if (token != null)
            {
                return token.ToObject<T>();
            }
        }
        catch (Exception e)
        {
            Debug.LogWarning($"[StateBridge] Failed to get nested var '{jsonPath}': {e.Message}");
        }
        return defaultValue;
    }

    public void ReceiveSceneChange(string sceneName)
    {
        try
        {
            debugText = $"Scene change requested: {sceneName}";

            // Attempt to load the scene that corresponds to the passage name
            StartCoroutine(LoadSceneByName(sceneName));
        }
        catch (Exception e)
        {
            debugText = "Error changing scene: " + e.Message;
            Debug.LogError(debugText);
        }
    }

    private System.Collections.IEnumerator LoadSceneByName(string sceneName)
    {
        // First, try to get the scene from build settings
        UnityEngine.SceneManagement.SceneManager.LoadScene(sceneName);

        // Wait for the scene to load
        yield return null;

        debugText += $"\nSuccessfully loaded scene: {sceneName}";
    }

    // Simple UI to show the data on screen
    void OnGUI()
    {
        GUI.skin.label.fontSize = 24;
        GUI.color = Color.black;
        GUI.Label(new Rect(20, 20, 800, 400), "Unity State Bridge:\n" + debugText);
    }
}