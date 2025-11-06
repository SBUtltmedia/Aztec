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
