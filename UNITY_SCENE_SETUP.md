# Unity Scene Setup - Quick Start

## Automated Setup (Recommended)

I've created an automated scene generator for you. Here's how to use it:

### Option 1: Use the Unity Editor Tool (Easiest)

1. **Open Unity**
   ```bash
   # The Unity project is at:
   cd /Users/pstdenis/Desktop/Aztec/Unity
   # Open this project in Unity Hub
   ```

2. **Run the Scene Generator**
   - In Unity, go to menu: `Tools > Generate Twine Passage Scenes`
   - A window will open showing all scenes that will be created
   - Click "Generate All Scenes" button
   - Click "Add All Scenes to Build Settings" button
   - Done! All 7 scenes are now created and ready

3. **Verify the Setup**
   - Open `File > Build Settings`
   - You should see all 7 scenes listed:
     - Start
     - Initialize User
     - Hub
     - Shared Counter Demo
     - Message Board Demo
     - User Registry Demo
     - About the Engine

### Option 2: Manual Setup

If you prefer to create scenes manually, follow the guide at:
`/Users/pstdenis/Desktop/Aztec/Unity/SETUP_SCENES.md`

## What the Generator Creates

For each scene, it automatically creates:

1. **Canvas** - UI container
2. **SceneNameText** - Large text displaying the scene name (using TextMeshPro if available)
3. **Bridge GameObject** - With StateBridge component to receive messages from Twine
4. **EventSystem** - For UI interaction

## After Scene Generation

Once scenes are created, rebuild Unity WebGL:

```bash
cd /Users/pstdenis/Desktop/Aztec
./build_unity_webgl.sh
```

This will:
1. Setup the Bridge in SampleScene
2. Build the WebGL output to `UnityWebGL/`
3. The build will include all your new scenes

## Testing the Integration

1. **Start the server**:
   ```bash
   npm start
   ```

2. **Open the demo**:
   - Navigate to `http://localhost:53134/Twine/UnityDemo.html?id=alice`

3. **Test scene switching**:
   - Click through the different demo links in Hub
   - Watch the Unity background text change to match each passage
   - Check browser console for messages like:
     ```
     Unity Bridge: Sending scene change -> 'Hub'
     Unity Bridge: Sent scene change to Unity: Hub
     ```

## Expected Behavior

When you navigate from one passage to another:

1. Twine detects passage change via `:passagestart` event
2. `unityBridge.js` sends `SCENE_CHANGE` message to Unity iframe
3. `Bridge.jslib` receives message and calls Unity method
4. `StateBridge.cs` loads the matching Unity scene
5. Unity scene displays its name in large text
6. You see the background change while Twine text remains readable

## Troubleshooting

### "Scene 'XYZ' couldn't be loaded"
- **Solution**: Run the scene generator again or manually add scenes to Build Settings

### No scene change visible
- **Solution**: Check browser console for errors, verify Bridge GameObject exists in each scene

### Can't find the Tools menu
- **Solution**: Make sure `SceneGenerator.cs` is in `Assets/Editor/` folder and Unity has compiled it

## Files Created

- `/Users/pstdenis/Desktop/Aztec/Unity/Assets/Editor/SceneGenerator.cs` - Automated scene generator tool
- `/Users/pstdenis/Desktop/Aztec/Unity/SETUP_SCENES.md` - Detailed manual setup guide
- This file - Quick reference

## Ready to Build?

After running the scene generator:

```bash
cd /Users/pstdenis/Desktop/Aztec
./build_unity_webgl.sh
```

The script will handle everything and output the WebGL build to `UnityWebGL/`.
