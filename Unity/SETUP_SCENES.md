# Unity Scene Setup Guide

## Overview
This guide will help you create Unity scenes that match your Twine passage names. When a player navigates to a Twine passage, Unity will automatically load the corresponding scene.

## Required Scenes

You need to create the following scenes in Unity:

1. **Start** - Initial entry point
2. **Initialize User** - User initialization
3. **Hub** - Main hub/menu
4. **Shared Counter Demo** - Shared counter demonstration
5. **Message Board Demo** - Message board demonstration
6. **User Registry Demo** - User registry demonstration
7. **About the Engine** - Information about the engine

## Step-by-Step Instructions

### For Each Scene:

1. **Create the Scene**
   - In Unity, go to `File > New Scene`
   - Choose `Basic (Built-in)` or `URP` template (match your project settings)

2. **Add Scene Name Display**
   - Right-click in Hierarchy → `UI > Canvas`
   - Right-click on Canvas → `UI > Text - TextMeshPro` (if available) or `UI > Text`
   - If prompted to import TMP Essentials, click "Import TMP Essentials"

3. **Configure the Text Element**
   - Name it "SceneNameText"
   - In the Inspector:
     - **Text**: Set to the scene name (e.g., "Hub", "Shared Counter Demo")
     - **Font Size**: 48-72
     - **Color**: White or bright color for visibility
     - **Alignment**: Center both horizontally and vertically
   - In Rect Transform:
     - **Anchor Preset**: Click the anchor preset button (top-left of Rect Transform)
     - Hold Shift+Alt and click the center-center preset (stretches to fill)
     - Set **Pos X**, **Pos Y**, **Pos Z** to 0

4. **Add the Bridge GameObject**
   - Right-click in Hierarchy → `Create Empty`
   - Name it "Bridge"
   - In Inspector, click `Add Component`
   - Search for "State Bridge" and add it
   - This is CRITICAL - without this, the scene won't receive messages from Twine

5. **Save the Scene**
   - `File > Save As`
   - Save to `Assets/Scenes/` folder
   - Name it EXACTLY as the passage name (e.g., "Hub.unity", "Shared Counter Demo.unity")
   - **Important**: Scene names must match passage names exactly (case-sensitive)

6. **Add to Build Settings**
   - `File > Build Settings`
   - Click `Add Open Scenes` button
   - Verify the scene appears in the "Scenes In Build" list

### Quick Scene Template

For faster setup, you can:

1. Create the first scene with all components (Canvas, Text, Bridge GameObject)
2. `File > Save As` and save it with the first scene name
3. Update the text to show the new scene name
4. `File > Save As` again with the next scene name
5. Repeat for all scenes

## Scene Names Checklist

- [ ] Start
- [ ] Initialize User
- [ ] Hub
- [ ] Shared Counter Demo
- [ ] Message Board Demo
- [ ] User Registry Demo
- [ ] About the Engine

## Verification

After creating all scenes:

1. Open `File > Build Settings`
2. Verify all 7 scenes are listed
3. Each scene should have an index number (0, 1, 2, etc.)
4. The scene order doesn't matter for this implementation

## Testing

After rebuilding with `build_unity_webgl.sh`:

1. Open `UnityDemo.html` in your browser
2. Navigate between passages
3. Watch the Unity background - the text should change to show the current scene name
4. Check the browser console for messages like:
   ```
   Unity Bridge: Sent scene change to Unity: Hub
   ```

## Troubleshooting

### Scene doesn't switch
- **Check**: Is the scene in Build Settings?
- **Check**: Does the scene name exactly match the passage name?
- **Check**: Does the scene have a GameObject named "Bridge" with StateBridge component?

### "Bridge object not found" error
- **Fix**: Add an empty GameObject named "Bridge" with the StateBridge.cs component

### Text not visible
- **Fix**: Increase font size, change color to white, ensure Canvas is in the scene
- **Fix**: Check z-index/layer ordering in Canvas settings

## Next Steps

After all scenes are created and added to Build Settings:

1. Run `./build_unity_webgl.sh` to rebuild Unity WebGL
2. Test the integration by opening EngineDemo.html
3. Navigate between passages and verify scene changes
