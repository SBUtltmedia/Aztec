# Minimal Unity WebGL Build - Fast Build Setup

## Problem
Unity builds are slow because of URP (Universal Render Pipeline) and other unnecessary features.

## Solution
Strip Unity down to bare minimum - Built-in Render Pipeline with minimal settings.

## Steps to Create Minimal Fast-Building Unity Project

### 1. Project Settings - Switch to Built-in Render Pipeline

1. **Remove URP**:
   - Delete `Assets/Settings/` folder (contains all URP assets)
   - Go to `Edit > Project Settings > Graphics`
   - Set "Scriptable Render Pipeline Settings" to `None`
   - Go to `Edit > Project Settings > Quality`
   - For each quality level, set "Render Pipeline" to `None`

2. **Simplify Quality Settings**:
   - `Edit > Project Settings > Quality`
   - Delete all quality levels except "Low"
   - Set "Low" as default for WebGL
   - In "Low" settings:
     - Pixel Light Count: 0
     - Texture Quality: Full Res
     - Anisotropic Textures: Disabled
     - Anti Aliasing: Disabled
     - Soft Particles: Disabled
     - Shadows: Disable Shadows
     - Shadow Resolution: Low Resolution
     - Shadow Distance: 0
     - Uncheck everything else

### 2. WebGL Player Settings - Minimal Build

1. **Go to `Edit > Project Settings > Player > WebGL Settings`**

2. **Resolution and Presentation**:
   - Default Canvas Width: 960
   - Default Canvas Height: 600
   - Run In Background: Enabled

3. **Other Settings**:
   - Color Space: Gamma (not Linear - faster)
   - Auto Graphics API: Enabled
   - Uncheck "Static Batching"
   - Uncheck "Dynamic Batching"
   - Strip Engine Code: Enabled
   - Managed Stripping Level: High
   - IL2CPP Code Generation: Faster runtime

4. **Publishing Settings**:
   - Compression Format: Disabled (faster build, slightly larger file)
   - OR Brotli (smaller file, slower build)
   - Decompression Fallback: Unchecked

### 3. Simplify Scenes

Each scene should have ONLY:
- Main Camera (clear flags: Solid Color, background: black)
- Canvas (Screen Space - Overlay)
  - Text showing scene name
- Bridge GameObject (with StateBridge.cs)
- EventSystem

NO lights, NO skybox, NO post-processing, NO 3D objects.

### 4. Build Settings

1. **`File > Build Settings`**
2. **Add only the scenes you need** (7 scenes for this demo)
3. **WebGL Platform Settings**:
   - Development Build: UNCHECKED (production builds are smaller/faster)
   - Compression Format: Disabled or Brotli
   - Code Optimization: Master Builds (Size)

### 5. Fast Build Script

Update `build_unity_webgl.sh` to use minimal settings:

```bash
"$UNITY_PATH" \
  -batchmode \
  -nographics \
  -quit \
  -projectPath "$PROJECT_PATH" \
  -executeMethod BuildCommand.PerformBuild \
  -buildOutput "$BUILD_OUTPUT" \
  -logFile "$LOG_FILE"
```

Remove `-development` flag for smaller/faster production builds.

## Expected Build Times

With these settings:
- **First build**: 2-5 minutes
- **Subsequent builds**: 1-2 minutes

Compared to URP builds which can take 10-20 minutes.

## What Gets Removed

- ❌ URP/Render Pipeline overhead
- ❌ Post-processing
- ❌ Advanced lighting
- ❌ Shadows
- ❌ 3D rendering features
- ❌ Heavy graphics features

## What Stays (All You Need)

- ✅ UI Canvas system (for text display)
- ✅ C# scripting (StateBridge.cs works fine)
- ✅ WebGL JavaScript interop (Bridge.jslib)
- ✅ Scene management (LoadScene works)
- ✅ PostMessage API communication

## Result

A real Unity WebGL build that:
- Builds in 1-2 minutes instead of 10-20 minutes
- Is much smaller in file size
- Still has full Unity scripting and scene switching
- Works perfectly with your Twine bridge
- Can be extended later by real Unity developers if needed

This is a legitimate Unity build - just optimized for speed, not graphics.
