# Unity-Twine Bridge Architecture

## The Problem You Identified

**Question**: "If the Bridge is only in SampleScene, will it break in other scenes?"

**Answer**: You were right to be concerned! The original setup only added the Bridge to SampleScene, which would have broken scene switching.

## The Solution

The **SceneGenerator.cs** automatically adds a Bridge GameObject to **EVERY** generated scene:

```csharp
// Create Bridge GameObject
GameObject bridgeGO = new GameObject("Bridge");
bridgeGO.AddComponent<StateBridge>();
```

This means each scene (Start, Hub, Shared Counter Demo, etc.) has its own Bridge GameObject.

## How It Works

### 1. Scene Structure

Each generated Unity scene contains:

- **Main Camera** (renders the scene)
- **Canvas** (UI layer)
  - **Text** (shows scene name)
- **Bridge GameObject** ← This is crucial!
  - **StateBridge.cs** component
- **EventSystem** (for UI interaction)

### 2. Message Flow

```text
Twine Passage Change
    ↓
unityBridge.js detects change
    ↓
Sends postMessage to Unity iframe
    {type: "SCENE_CHANGE", payload: "Hub"}
    ↓
Bridge.jslib receives message
    ↓
Calls Unity method: SendMessage('Bridge', 'ReceiveSceneChange', 'Hub')
    ↓
StateBridge.cs receives call
    ↓
LoadScene("Hub")
    ↓
Hub scene loads (which also has a Bridge GameObject!)
    ↓
New scene's Bridge is ready to receive messages
```

### 3. Why Each Scene Needs a Bridge

When Unity loads a new scene, **all GameObjects from the previous scene are destroyed** (unless marked `DontDestroyOnLoad`).

If only SampleScene had the Bridge:

1. ❌ Load Hub scene → SampleScene destroyed → Bridge destroyed
2. ❌ Twine sends message → No Bridge to receive it → Communication broken
3. ❌ Scene stuck, can't switch anymore

With Bridge in every scene:

1. ✅ Load Hub scene → Hub's Bridge is active
2. ✅ Twine sends message → Hub's Bridge receives it
3. ✅ Load next scene → New scene's Bridge is active
4. ✅ Continuous communication

## Build Configuration

### What We Removed

- **BridgeSetup.SetupScene** - This only set up SampleScene (not needed)
- **SampleScene from build** - We use the generated scenes instead

### What Stays

1. **SceneGenerator** creates scenes with Bridge
2. **Build** includes all generated scenes
3. Each scene has its own Bridge GameObject

## Files

- [Unity/Assets/Editor/SceneGenerator.cs](Unity/Assets/Editor/SceneGenerator.cs:139-140) - Adds Bridge to each scene
- [Unity/Assets/Scripts/StateBridge.cs](Unity/Assets/Scripts/StateBridge.cs) - Bridge component
- [Unity/Assets/Plugins/WebGL/Bridge.jslib](Unity/Assets/Plugins/WebGL/Bridge.jslib) - JavaScript plugin
- [static/unityBridge.js](static/unityBridge.js) - Twine-side bridge

## Verification

After building, you can verify each scene has a Bridge:

1. Open Unity
2. Open each scene in `Assets/Scenes/`
3. Check Hierarchy for "Bridge" GameObject
4. Verify it has StateBridge component attached

## Why This Works

- ✅ Every scene is self-contained and can receive messages
- ✅ Scene switching doesn't break communication
- ✅ No DontDestroyOnLoad complexity needed
- ✅ Clean architecture - each scene knows how to receive state

This is the correct approach for Unity scene-based architecture.

## Testing

The bridge is covered by a Playwright test suite (12/12 passing):

```bash
npm run test:bridge
```

Tests verify both directions of communication without requiring Unity to be running (Unity→Twine messages are simulated via `window.dispatchEvent`).

## Important: SugarCube Scope in `unityBridge.js`

`unityBridge.js` is loaded via `importScripts()` which injects it as a `<script>` tag in the browser global scope. In this scope, `window.State` is **undefined** — SugarCube does not expose its internal `State` object as a global. The only reliable API is:

```javascript
window.SugarCube?.State?.variables   // read/write story variables
window.SugarCube?.State?.passage     // current passage name
```

Any `typeof State !== 'undefined'` guard will always be `false` in this context.
