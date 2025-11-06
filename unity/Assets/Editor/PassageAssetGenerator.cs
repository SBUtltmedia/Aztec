// Assets/Editor/PassageAssetGenerator.cs
using UnityEngine;
using UnityEditor;
using System.IO;
using System.Text.RegularExpressions;
using System.Collections.Generic;
using System.Xml; // We'll use this for robust parsing

public class PassageAssetGenerator
{
    // Define the folder where your assets will be created
    private const string OUTPUT_FOLDER = "Assets/Narrative/PassageAssets";

    // This adds a menu item at the top of the Unity Editor
    [MenuItem("Assets/Narrative/Generate Passage Assets from Twine HTML", false, 10)]
    private static void GenerateAssets()
    {
        // Get the .html file the user has selected in the Project window
        TextAsset htmlFile = Selection.activeObject as TextAsset;
        if (htmlFile == null || !AssetDatabase.GetAssetPath(htmlFile).EndsWith(".html"))
        {
            EditorUtility.DisplayDialog("Error", "Please select your compiled Twine .html file in the Project window.", "OK");
            return;
        }

        string htmlContent = htmlFile.text;

        // Ensure the output directory exists
        if (!Directory.Exists(OUTPUT_FOLDER))
        {
            Directory.CreateDirectory(OUTPUT_FOLDER);
        }

        // 1. Find all passage names from the <tw-storydata> tag
        var twinePassageNames = new HashSet<string>();
        try
        {
            // Find the <tw-storydata> tag
            Match storyDataMatch = Regex.Match(htmlContent, @"<tw-storydata[\s\S]*?</tw-storydata>");
            if (!storyDataMatch.Success)
            {
                throw new System.Exception("Could not find <tw-storydata> tag in the HTML file.");
            }

            string storyDataContent = storyDataMatch.Value;

            // Use Regex to find all <tw-passagedata ... name=\"...\" ...> tags
            // This is safer than full XML parsing on potentially malformed HTML
            MatchCollection passageMatches = Regex.Matches(storyDataContent, @"<tw-passagedata[\s\S]*?name=""([^""]*)""[\s\S]*?>");

            foreach (Match match in passageMatches)
            {
                string cleanName = match.Groups[1].Value.Trim();
                if (!string.IsNullOrEmpty(cleanName))
                {
                    // The HTML parser might decode special characters, so we unescape them
                    // e.g., 'Level 1 > 2' becomes 'Level 1 > 2'
                    twinePassageNames.Add(System.Net.WebUtility.HtmlDecode(cleanName));
                }
            }
        }
        catch (System.Exception e)
        {
            EditorUtility.DisplayDialog("Error", $"Failed to parse Twine HTML file. Is this a valid SugarCube 2 HTML file?\n\nError: {e.Message}", "OK");
            return;
        }

        Debug.Log($"Found {twinePassageNames.Count} unique passage names in {htmlFile.name}.");

        // 2. Find all existing PassageAsset files to avoid duplicates
        var existingAssets = new Dictionary<string, PassageAsset>();
        string[] guids = AssetDatabase.FindAssets($"t:{typeof(PassageAsset).Name}", new[] { OUTPUT_FOLDER });
        foreach (string guid in guids)
        {
            string path = AssetDatabase.GUIDToAssetPath(guid);
            PassageAsset asset = AssetDatabase.LoadAssetAtPath<PassageAsset>(path);
            if (asset != null && !string.IsNullOrEmpty(asset.passageName) && !existingAssets.ContainsKey(asset.passageName))
            {
                existingAssets.Add(asset.passageName, asset);
            }
        }

        // 3. Create any assets that are missing
        int newAssetsCreated = 0;
        foreach (string passageName in twinePassageNames)
        {
            if (!existingAssets.ContainsKey(passageName))
            {
                // This passage exists in Twine but not in Unity. Create it.
                PassageAsset newAsset = ScriptableObject.CreateInstance<PassageAsset>();
                newAsset.passageName = passageName;

                // Sanitize the passage name to be a valid file name
                string safeName = string.Join("_", passageName.Split(Path.GetInvalidFileNameChars()));
                string assetPath = Path.Combine(OUTPUT_FOLDER, $"{safeName}.asset");
                
                // Ensure the file name is unique
                assetPath = AssetDatabase.GenerateUniqueAssetPath(assetPath);

                AssetDatabase.CreateAsset(newAsset, assetPath);
                newAssetsCreated++;
            }
        }

        AssetDatabase.SaveAssets();
        AssetDatabase.Refresh();

        EditorUtility.DisplayDialog("Success", $"Generation complete!\n\nFound: {twinePassageNames.Count} passages\nCreated: {newAssetsCreated} new assets\nExisting: {existingAssets.Count} assets", "OK");
    }
}
