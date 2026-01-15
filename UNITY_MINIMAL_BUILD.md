# Minimal Unity WebGL Build - Fast Proof of Concept

## The Problem

Unity builds are painfully slow (10-20 minutes) because of:
- URP (Universal Render Pipeline) overhead
- Post-processing effects
- Advanced lighting and shadows
- Unnecessary graphics features
- Development mode bloat

## The Solution

This is a **real Unity build**, just stripped to bare minimum for fast iteration:
- Built-in Render Pipeline (not URP)
- No compression (faster build)
- No development mode (smaller/faster)
- High code stripping
- Minimal scenes (just Canvas + Text + Bridge)

## Build Time

- **First build**: 2-5 minutes
- **Subsequent builds**: 1-2 minutes
- **URP builds**: 10-20 minutes ❌

## What This Proves

This minimal build demonstrates:
✅ Real Unity WebGL compilation
✅ Scene switching based on Twine passages
✅ JavaScript ↔ Unity communication (postMessage)
✅ C# script execution (StateBridge.cs)
✅ UI rendering (Canvas text)

Your Unity developers can add:
- 3D graphics
- Lighting
- Particles
- Physics
- Whatever they want

## Quick Start - Automated Setup

Run the automated script:

```bash
cd /Users/pstdenis/Desktop/Aztec
./setup_minimal_unity.sh
```

This script will:
1. Generate 7 minimal Unity scenes (one per Twine passage)
2. Add Bridge GameObject to each scene
3. Add scenes to build settings
4. Build WebGL with minimal/fast settings

## Quick Start - Manual Steps

If you prefer manual control:

### 1. Generate Scenes

Open Unity project and go to `Tools > Generate Twine Passage Scenes`:
- Click "Generate All Scenes"
- Click "Add All Scenes to Build Settings"

### 2. Build

```bash
./build_unity_webgl.sh
```

## What Gets Built

7 Unity scenes, each with:
- **Main Camera** (black background)
- **Canvas** (UI layer)
  - **Text** displaying scene name in large white text
- **Bridge GameObject** (receives messages from Twine)
- **EventSystem** (for UI)

That's it. No bloat.

## Testing

1. Start the server:
   ```bash
   npm start
   ```

2. Open in browser:
   ```
   http://localhost:53134/Twine/UnityDemo.html?id=alice
   ```

3. Navigate between passages and watch:
   - Unity background text changes to show scene name
   - Browser console shows scene change messages
   - Twine text remains readable over Unity

## For Your Team

Tell them:
> "This is a minimal Unity WebGL proof of concept that builds in 2 minutes instead of 20. It proves the Twine ↔ Unity bridge works. You can now add whatever graphics/features you want - the communication layer is solid."

## What Makes It Fast

1. **No URP** - Removed Universal Render Pipeline
2. **No Compression** - `WebGLCompressionFormat.Disabled`
3. **Production Build** - Not development mode
4. **High Stripping** - `ManagedStrippingLevel.High`
5. **Minimal Scenes** - Just UI, no 3D objects
6. **Strip Engine Code** - Removes unused Unity features

## Files Modified

- [BuildCommand.cs](Unity/Assets/Editor/BuildCommand.cs) - Forces minimal settings
- [SceneGenerator.cs](Unity/Assets/Editor/SceneGenerator.cs) - Creates empty scenes, not DefaultGameObjects
- [build_unity_webgl.sh](build_unity_webgl.sh) - Removed `-development` flag
- [setup_minimal_unity.sh](setup_minimal_unity.sh) - New automated setup script

## Upgrading Later

When your Unity developers want to add features:

1. They can switch to URP if needed (`Edit > Project Settings > Graphics`)
2. Add lights, shadows, post-processing
3. Replace text scenes with 3D environments
4. Enable compression (`PlayerSettings.WebGL.compressionFormat`)

The Bridge communication stays the same - just the visual output changes.

## This Is Real Unity

This is NOT a fake/simulation. It's a legitimate Unity 6000.0.23f1 WebGL build with:
- Real C# scripting
- Real scene management
- Real JavaScript interop
- Real UI Canvas system

Just optimized for build speed over graphics quality.
