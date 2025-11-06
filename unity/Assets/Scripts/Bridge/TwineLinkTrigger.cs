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
