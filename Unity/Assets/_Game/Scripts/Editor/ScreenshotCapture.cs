using UnityEngine;
using UnityEditor;
using System.IO;

public static class ScreenshotCapture
{
    [MenuItem("Tools/Capture Screenshot")]
    public static void CaptureScreenshot()
    {
        string folderPath = "Assets/Screenshots";
        if (!Directory.Exists(folderPath))
            Directory.CreateDirectory(folderPath);

        string filename = $"screenshot_{System.DateTime.Now:yyyyMMdd_HHmmss}.png";
        string path = Path.Combine(folderPath, filename);

        ScreenCapture.CaptureScreenshot(path);
        Debug.Log($"Screenshot saved to: {path}");

        EditorApplication.delayCall += () => AssetDatabase.Refresh();
    }
}
