using UnityEngine;
using TMPro;

/// <summary>
/// SyncText: Bind any shared variable to a TextMeshPro component without writing code.
/// Usage: Drag this onto a UI text object, assign the GameState asset, and type the path (e.g. "users.alice.score").
/// </summary>
[RequireComponent(typeof(TMP_Text))]
public class SyncText : MonoBehaviour
{
    public GameStateSO gameState;
    public string variablePath;
    public string formatString = "{0}";

    private TMP_Text _text;

    void Awake()
    {
        _text = GetComponent<TMP_Text>();
    }

    void OnEnable()
    {
        if (gameState != null)
        {
            gameState.OnStateUpdated += UpdateDisplay;
            UpdateDisplay();
        }
    }

    void OnDisable()
    {
        if (gameState != null)
        {
            gameState.OnStateUpdated -= UpdateDisplay;
        }
    }

    void UpdateDisplay()
    {
        if (gameState == null || string.IsNullOrEmpty(variablePath)) return;

        // Dynamic lookup! Works for any variable name added in Twine.
        object value = gameState.Get<object>(variablePath);
        
        if (value != null)
        {
            _text.text = string.Format(formatString, value);
        }
    }
}
