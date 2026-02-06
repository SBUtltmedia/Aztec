using UnityEngine;
using UnityEngine.UI;

/// <summary>
/// SyncButton: A no-code component to make Unity buttons update Twine/Multiplayer state.
/// Usage: Add to a Button, assign the StateBridge, and set the variable to update.
/// </summary>
[RequireComponent(typeof(Button))]
public class SyncButton : MonoBehaviour
{
    public StateBridge bridge;
    
    [Header("Settings")]
    [Tooltip("The variable to update (include $ prefix), e.g. $globalCounter")]
    public string variablePath = "$globalCounter";
    
    [Tooltip("The amount to add. Use negative for subtraction.")]
    public float amount = 1f;

    void Start()
    {
        if (bridge == null)
        {
            bridge = FindFirstObjectByType<StateBridge>();
        }

        if (bridge == null)
        {
            Debug.LogWarning($"[SyncButton] No StateBridge found for {gameObject.name}. Button will not sync.");
            return;
        }

        GetComponent<Button>().onClick.AddListener(OnClick);
    }

    void OnClick()
    {
        if (bridge != null)
        {
            Debug.Log($"[SyncButton] Requesting update: {variablePath} += {amount}");
            bridge.ThAdd(variablePath, amount);
        }
    }
}
