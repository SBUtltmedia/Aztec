# Unity Project - Git Guidelines

## ✅ What IS committed to git (essential for collaboration)

- `Assets/` - Your scenes, scripts, prefabs, materials, textures
- `Packages/manifest.json` - Package dependencies
- `ProjectSettings/` - Project configuration settings

## ❌ What is NOT committed (auto-generated, will cause conflicts)

- `Library/` - Unity's cache (auto-regenerated, 100MB+)
- `Temp/` - Temporary build files
- `Obj/` - Compiled code
- `Build/` & `Builds/` - Build output
- `Logs/` - Log files
- `UserSettings/` - Personal preferences
- `*.csproj`, `*.sln` - Auto-generated IDE project files

## 🚀 How to work with this project

### First Time Setup

1. **Clone the repo**:
   ```bash
   git clone https://github.com/SBUtltmedia/Aztec.git
   cd Aztec
   ```

2. **Open Unity project**:
   - Open Unity Hub
   - Click "Open" and select the `Aztec/Unity` folder
   - Unity will automatically regenerate the `Library/` folder (takes 1-2 minutes first time)

3. **You're ready!** All assets, scenes, and scripts are there.

### Daily Workflow

1. **Pull latest changes**:
   ```bash
   git pull origin unity
   ```

2. **Make your changes** in Unity (edit scenes, add scripts, etc.)

3. **Commit only your work**:
   ```bash
   git add Unity/Assets/
   git add Unity/ProjectSettings/
   git commit -m "Add new 3D environment to Hub scene"
   git push
   ```

The `.gitignore` automatically excludes bloat.

## 🎯 What's Currently in the Project

### Scenes (in `Assets/Scenes/`)
- **Start.unity** - Starting scene
- **Hub.unity** - Main menu/hub
- **Shared Counter Demo.unity**
- **Message Board Demo.unity**
- **User Registry Demo.unity**
- **About the Engine.unity**
- **Initialize User.unity**

Each scene has:
- Main Camera (black background)
- Canvas with Text showing scene name (for testing)
- Bridge GameObject with StateBridge.cs (receives messages from Twine)

### Scripts (in `Assets/Scripts/`)
- **StateBridge.cs** - Handles communication with Twine (scene switching, state updates)

### Editor Tools (in `Assets/Editor/`)
- **SceneGenerator.cs** - Auto-generates scenes matching Twine passages
- **BuildCommand.cs** - Custom build script for minimal WebGL builds
- **BridgeSetup.cs** - Configures Bridge GameObject
- **CleanupBuildSettings.cs** - Utility to remove scenes from build

### Plugins (in `Assets/Plugins/WebGL/`)
- **Bridge.jslib** - JavaScript plugin for WebGL interop with Twine

## 🎨 How to Extend This

### Replace Text Scenes with 3D Environments

1. Open any scene (e.g., `Hub.unity`)
2. Add your 3D objects, lights, effects, whatever you want
3. **Keep the Bridge GameObject!** (Don't delete it)
4. Delete the simple text if you want (SceneNameText)
5. Save scene
6. Commit: `git add Unity/Assets/Scenes/Hub.unity` and push

The Bridge will still work - it's invisible but receives messages from Twine.

### Add New Scenes

If you add a new scene that should match a Twine passage:

1. Create scene in Unity
2. Add a "Bridge" GameObject with StateBridge component
3. Add scene to Build Settings (File > Build Settings > Add Open Scenes)
4. Scene name must exactly match the Twine passage name
5. Commit and push

## 🔧 Building WebGL

From the root `Aztec/` folder:

```bash
./build_unity_webgl.sh
```

Output goes to `../UnityWebGL/Build/`

This build is optimized for speed (2-5 minutes) not graphics quality. You can re-enable URP later if needed.

## 🆘 Troubleshooting

### "Unity won't open / Library missing"
✅ Normal! Unity auto-generates `Library/` on first open. Takes 1-2 minutes.

### "My scene changes aren't showing up"
✅ Make sure you saved the scene in Unity (Cmd+S / Ctrl+S)

### "Git says files are too large"
✅ You probably accidentally committed `Library/`. Run:
```bash
git rm -r --cached Unity/Library
git commit -m "Remove Unity Library folder"
```

### "Bridge not working in my scene"
✅ Make sure your scene has a GameObject named "Bridge" with StateBridge.cs component attached.

## 📖 How the Twine-Unity Bridge Works

1. **Twine detects passage change** (e.g., user clicks "Go to Hub")
2. **JavaScript bridge sends message** via postMessage API: `{type: "SCENE_CHANGE", payload: "Hub"}`
3. **Bridge.jslib receives message** in Unity WebGL
4. **StateBridge.cs loads scene**: `SceneManager.LoadScene("Hub")`
5. **Unity shows new scene** (Hub.unity)

Your job: Make those scenes look cool! The communication is already handled.

## 🎮 Current Demo

The current demo is minimal - just text showing scene names. This proves the integration works. Now Unity developers can replace these with actual 3D environments, gameplay, whatever you want.

**The bridge architecture is solid - just add content!**
