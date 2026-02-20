using UnityEngine;
using System;
using System.Collections.Generic;
using Newtonsoft.Json.Linq;

[CreateAssetMenu(fileName = "GameState", menuName = "Theyr/GameState")]
public class GameStateSO : ScriptableObject
{
    private JObject _rawState = new JObject();
    
    /// <summary>
    /// Event fired whenever any variable in the state changes.
    /// </summary>
    public event Action OnStateUpdated;

    /// <summary>
    /// Merge an incoming JSON object into the state (safe for both full state and partial diffs).
    /// Full state on passage navigation: all keys are overwritten.
    /// Partial diff from server: only changed keys are updated; rest preserved.
    /// </summary>
    public void UpdateFromJSON(string json)
    {
        try
        {
            var incoming = JObject.Parse(json);
            _rawState.Merge(incoming);
            OnStateUpdated?.Invoke();
        }
        catch (Exception e)
        {
            Debug.LogError($"[GameStateSO] Parse Error: {e.Message}");
        }
    }

    /// <summary>
    /// Get a variable value using a path string (e.g. "gold" or "users.alice.score").
    /// No C# modification required for new variables!
    /// </summary>
    public T Get<T>(string path, T defaultValue = default)
    {
        if (_rawState == null) return defaultValue;

        try
        {
            JToken token = _rawState.SelectToken(path);
            if (token != null)
            {
                return token.ToObject<T>();
            }
        }
        catch (Exception e)
        {
            Debug.LogWarning($"[GameStateSO] Could not get path '{path}': {e.Message}");
        }
        return defaultValue;
    }

    /// <summary>
    /// Check if a variable exists.
    /// </summary>
    public bool Has(string path)
    {
        return _rawState?.SelectToken(path) != null;
    }
}
