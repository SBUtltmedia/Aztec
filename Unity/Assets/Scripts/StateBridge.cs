using UnityEngine;
using System.Runtime.InteropServices;
using System.Collections.Generic;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq; // Added for JObject
using System;

public class StateBridge : MonoBehaviour
{
    public static Dictionary<string, object> Variables = new Dictionary<string, object>();
    
    // For display in the demo
    private string debugText = "Waiting for SugarCube data...";
    private string lastStrength = "N/A";

    [DllImport("__Internal")]
    private static extern void InitMessageListener();

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
            debugText = $"Received {Variables.Count} root variables.";

            // Attempt to parse specific nested path: $user[userId].stats.strength
            if (Variables.ContainsKey("user") && Variables.ContainsKey("userId"))
            {
                // We parse the entire JSON as a JObject to traverse safely without 'dynamic'
                JObject root = JObject.Parse(jsonState);

                string currentUserId = root["userId"].ToString();

                // Navigate via JTokens: user -> [userId] -> stats -> strength
                JToken userToken = root["user"][currentUserId];

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