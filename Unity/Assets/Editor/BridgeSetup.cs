using UnityEngine;
using UnityEditor;
using UnityEditor.SceneManagement;

public class BridgeSetup
{
    public static void SetupScene()
    {
        string scenePath = "Assets/Scenes/SampleScene.unity";
        Debug.Log($"Opening scene: {scenePath}");
        
        EditorSceneManager.OpenScene(scenePath);
        
        GameObject bridgeObj = GameObject.Find("Bridge");
        if (bridgeObj == null)
        {
            bridgeObj = new GameObject("Bridge");
            Debug.Log("Created 'Bridge' GameObject.");
        }
        else
        {
            Debug.Log("'Bridge' GameObject already exists.");
        }

        if (bridgeObj.GetComponent<StateBridge>() == null)
        {
            bridgeObj.AddComponent<StateBridge>();
            Debug.Log("Attached 'StateBridge' component.");
        }
        
        EditorSceneManager.SaveScene(EditorSceneManager.GetActiveScene());
        Debug.Log("Scene saved.");
    }
}
