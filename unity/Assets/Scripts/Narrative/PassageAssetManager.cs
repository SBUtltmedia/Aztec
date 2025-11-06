// PassageAssetManager.cs
using System.Collections.Generic;
using UnityEngine;

public class PassageAssetManager : MonoBehaviour
{
    [Tooltip("This list will be auto-populated by the Editor script")]
    public List<PassageAsset> allPassageAssets = new List<PassageAsset>();

    // A dictionary for fast, O(1) lookups at runtime
    private Dictionary<string, PassageAsset> passageLookup;

    [Header("System References")]
    public AudioSource musicSource;
    public AudioSource sfxSource;
    // You could also have a PrefabManager, CutsceneManager, etc.

    void Awake()
    {
        // Convert the list into a dictionary for fast lookups
        passageLookup = new Dictionary<string, PassageAsset>();
        foreach (var asset in allPassageAssets)
        {
            if (asset != null && !passageLookup.ContainsKey(asset.passageName))
            {
                passageLookup.Add(asset.passageName, asset);
            }
        }
        Debug.Log($"PassageAssetManager initialized with {passageLookup.Count} assets.");
    }

    /// <summary>
    /// This is called by the UnityStateReceiver.
    /// It finds the matching asset and activates its content.
    /// </summary>
    public void ActivatePassage(string passageName)
    {
        if (passageLookup.TryGetValue(passageName, out PassageAsset asset))
        {
            Debug.Log($"Activating assets for passage: {passageName}");

            // 1. Play Music
            if (asset.musicClip != null && musicSource.clip != asset.musicClip)
            {
                musicSource.clip = asset.musicClip;
                musicSource.Play();
            }

            // 2. Play SFX
            if (asset.sfxClip != null)
            {
                sfxSource.PlayOneShot(asset.sfxClip);
            }

            // 3. Spawn Prefab
            if (asset.prefabToSpawn != null)
            {
                // You'll want a more robust spawning system,
                // but this is the basic idea.
                Instantiate(asset.prefabToSpawn, Vector3.zero, Quaternion.identity);
            }

            // 4. Fire any custom events
            if (asset.OnPassageActivated != null)
            {
                asset.OnPassageActivated.Invoke();
            }
        }
        else
        {
            Debug.LogWarning($"No PassageAsset found for passage: {passageName}");
        }
    }
}
