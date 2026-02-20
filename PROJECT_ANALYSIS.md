# Aztec Unity Project Analysis

A **server-authoritative multiplayer interactive fiction engine** that merges Twine narrative storytelling with Unity WebGL visualization.

## Project Goals

1. **Unified Storytelling Platform** - Combine text-based Twine passages with visual Unity scenes
2. **Real-time Multiplayer** - Synchronize game state across all connected players via Socket.IO
3. **Server Authority** - Node.js server acts as the single source of truth for game state
4. **Fast Iteration** - Minimal Unity build configuration for rapid 2-5 minute WebGL builds
5. **Bidirectional State** - Both Twine AND Unity can modify shared multiplayer state

---

## Architecture Overview

```
Browser Window
├── Twine/SugarCube (z-index: 1, foreground)
│   ├── Passages (text content)
│   ├── Story data and state
│   └── Links for navigation
│
├── Unity WebGL iframe (z-index: 0, background)
│   ├── Scenes matching passage names
│   ├── Bridge GameObject (sends & receives messages)
│   └── Visual representation
│
└── Communication Layer (BIDIRECTIONAL)
    ├── Twine → Unity (postMessage: SCENE_CHANGE, STATE_UPDATE)
    ├── Unity → Server (postMessage: UNITY_STATE_UPDATE, UNITY_ATOMIC_UPDATE)
    ├── Server → All Clients (Socket.IO broadcast)
    └── Node.js Server (state authority)
```

---

## Core Components

### Unity Scripts

| File | Purpose |
|------|---------|
| [StateBridge.cs](Assets/Scripts/StateBridge.cs) | **Bidirectional bridge** - receives state AND sends updates to server via ThSet/ThAdd |
| [Bridge.jslib](Assets/Plugins/WebGL/Bridge.jslib) | JavaScript plugin for both inbound and outbound postMessage |
| [SceneGenerator.cs](Assets/Editor/SceneGenerator.cs) | Auto-generates 7 scenes matching Twine passage names |
| [BuildCommand.cs](Assets/Editor/BuildCommand.cs) | Custom WebGL build pipeline with minimal settings |

### Integration Scripts (Parent Directory)

| File | Purpose |
|------|---------|
| [unityBridge.js](../static/unityBridge.js) | **Bidirectional relay** - Twine↔Unity↔Server message routing |
| [UnityDemo.twee](../Twine/UnityDemo.twee) | Simple scene-switching demo |
| [00_Setup.twee](../Twine/EngineDemo/00_Setup.twee) | Multiplayer demo with `<<th-set>>` macro |

---

## Bidirectional Message Flow

### Twine → Unity (existing)
```
1. Player clicks link in Twine passage
2. SugarCube triggers :passagestart event
3. unityBridge.js sends postMessage to Unity iframe
4. Bridge.jslib receives and calls StateBridge methods
5. Unity scene loads / state updates
```

### Unity → Server (NEW)
```
1. Unity calls StateBridge.ThSet("$sharedCounter", 42)
2. Bridge.jslib sends postMessage to parent window
3. unityBridge.js receives UNITY_STATE_UPDATE
4. Updates local SugarCube state
5. Sends to server via Socket.IO
6. Server broadcasts to all clients
7. All clients (including Unity) receive update
```

---

## Unity C# API for Multiplayer State

Unity developers can now modify shared state using the `StateBridge` class:

### Setting Variables (equivalent to `<<th-set '$var' to value>>`)

```csharp
// Set a shared variable - broadcasts to all clients
StateBridge.ThSet("$sharedCounter", 42);
StateBridge.ThSet("$gamePhase", "battle");
StateBridge.ThSet("$users[$userId].score", 100);
```

### Atomic Operations (equivalent to `<<th-set '$var' += value>>`)

```csharp
// Atomic add - prevents race conditions
StateBridge.ThAdd("$sharedCounter", 10);      // $sharedCounter += 10

// Atomic subtract
StateBridge.ThSubtract("$health", 5);          // $health -= 5

// Atomic multiply/divide
StateBridge.ThMultiply("$multiplier", 2);      // $multiplier *= 2
StateBridge.ThDivide("$score", 10);            // $score /= 10
```

### Reading Variables

```csharp
// Simple variable access
int counter = StateBridge.GetVar<int>("sharedCounter", 0);
string phase = StateBridge.GetVar<string>("gamePhase", "lobby");

// Nested JSON path access
int score = StateBridge.GetNestedVar<int>("users.alice.score", 0);

// Subscribe to state changes
StateBridge.OnStateReceived += (vars) => {
    Debug.Log("State updated with " + vars.Count + " variables");
};
```

---

## Twine Macro Reference

### `<<th-set>>` - Server-Authoritative Variable Setter
```
<<th-set '$counter' += 1>>
<<th-set '$users[$userId].score' to 100>>
```
- Updates local variable immediately (optimistic)
- Sends update to Node.js server via Socket.IO
- Server broadcasts to all connected clients
- Supports operators: `+=`, `-=`, `*=`, `/=`, `%=`

### `<<liveblock>>` - Auto-Updating Content
```
<<liveblock>>
  Counter: $counter
<</liveblock>>
```
- Wraps content that auto-updates when state changes
- Re-renders when `:liveupdateinternal` event fires

---

## Scenes

All scenes are in `Assets/Scenes/` and include a Bridge GameObject with StateBridge component:

- **Start** - Entry point
- **Initialize User** - User setup
- **Hub** - Central navigation
- **Shared Counter Demo** - Multiplayer counter example
- **Message Board Demo** - Shared messaging
- **User Registry Demo** - Player registration
- **About the Engine** - Documentation

**Critical Design Decision:** Each scene has its own Bridge GameObject because Unity destroys GameObjects when loading new scenes.

---

## Build System

Run the build script:
```bash
./build_unity_webgl.sh
```

**Optimizations for fast builds (2-5 minutes vs typical 10-20):**
- Disabled compression
- High code stripping level
- Built-in render pipeline (no URP)
- Strips engine code

Output: `../UnityWebGL/Build/`

---

## Key Technical Decisions

| Decision | Rationale |
|----------|-----------|
| Bridge in every scene | Ensures continuous communication after scene loads |
| Bidirectional postMessage | Both Twine and Unity can modify shared state |
| Optimistic local updates | UI feels instant while server confirms |
| Atomic operations | Prevents race conditions for +=, -= etc. |
| Minimal build config | 4x faster builds by stripping URP and compression |
| Z-index layering | Unity (0) behind Twine (1) for text readability |
| Server-authoritative | Single source of truth prevents state conflicts |
| Exception variables | `$userId`, `$god`, `$godParam`, `$passageHistory` stay local |

---

## Project Status

### Working
- Scene generation (7 scenes auto-created)
- Bridge communication in every scene
- **Bidirectional state sync** (Twine ↔ Unity ↔ Server)
- Scene switching (Twine → Unity)
- State synchronization (Server → All Clients)
- **Unity ThSet/ThAdd API** for modifying shared state
- Multiplayer state sharing via Socket.IO
- Custom `<<th-set>>` and `<<liveblock>>` macros
- Fast WebGL builds
- **Playwright test suite** — 12/12 passing (`npm run test:bridge`)

### Key Technical Gotcha

Scripts loaded via `importScripts()` run in global scope where `window.State` is **undefined** — only `window.SugarCube.State` is accessible. All variable reads/writes in `unityBridge.js` use `window.SugarCube?.State?.variables` directly.

### Git Status
- **Branch:** `unity`
- **Main branch:** `master`

---

## Related Documentation

- [BRIDGE_ARCHITECTURE.md](../BRIDGE_ARCHITECTURE.md) - Detailed bridge implementation
- [README_UNITY_INTEGRATION.md](../README_UNITY_INTEGRATION.md) - Integration guide
- [MINIMAL_SETUP.md](../MINIMAL_SETUP.md) - Minimal configuration details
