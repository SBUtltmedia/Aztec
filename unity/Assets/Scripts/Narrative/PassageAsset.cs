// PassageAsset.cs
using UnityEngine;
using UnityEngine.Events;

[CreateAssetMenu(fileName = "NewPassageAsset", menuName = "Narrative/Passage Asset")]
public class PassageAsset : ScriptableObject
{
    [Header("Twine Link")]
    [Tooltip("The passage name from Twine (e.g., 'Start', 'SnakePit')")]
    public string passageName; // This is the "key"

    [Header("Unity Assets")]
    [Tooltip("Prefab to spawn when this passage is activated")]
    public GameObject prefabToSpawn;

    [Tooltip("Music or Ambience to play")]
    public AudioClip musicClip;

    [Tooltip("One-shot sound effect to play")]
    public AudioClip sfxClip;

    [Header("Advanced")]
    [Tooltip("A list of custom UnityEvents to run")]
    public UnityEvent OnPassageActivated;
}
