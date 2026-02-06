# 🎮 Unity-Twine Multiplayer Setup Guide

This guide explains how to use the **Theyr Engine** to build Unity WebGL games that are synchronized with a Twine story in real-time.

---

## 🏗️ The Architecture
Theyr uses a "Pro" Unity workflow based on **ScriptableObjects**.
1.  **StateBridge**: The "Radio" that receives data from the browser.
2.  **GameStateSO**: The "Source of Truth" asset that stores all shared variables.
3.  **Components**: Scripts like `SyncText` that automatically listen to the state and update your UI.

---

## 🚀 Quick Start: 3 Steps to Sync

### 1. Create your GameState Asset
*   In the Unity Project window, **Right-Click** -> **Create > Theyr > GameState**.
*   Name it `GlobalState`.
*   *Note: This asset lives in your project files and can be dragged into any scene.*

### 2. Set up the Bridge
*   In every scene where you want multiplayer, add a GameObject with the **`StateBridge`** component.
*   Drag your `GlobalState` asset into the **Game State** slot in the Inspector.

### 3. Display a Variable (No Code!)
*   Add a **TextMeshPro** (or standard Text) object to your scene.
*   Add the **`SyncText`** component to that object.
*   Drag `GlobalState` into the **Game State** slot.
*   Type the name of the Twine variable in **Variable Path** (e.g., `globalCounter` or `users.alice.score`).
*   The text will now update automatically whenever that variable changes in Twine!

---

## 🔘 Interacting: Updating State from Unity

To make a Unity button update a Twine variable:
1.  Add the **`SyncButton`** component to any Unity UI Button.
2.  Set the **Variable Path** (e.g., `$globalCounter`).
3.  Set the **Amount** (e.g., `1` to add, `-1` to subtract).
4.  Clicking the button in Unity will now update the state for **every player in the game**.

---

## 🎭 Scene Synchronization
Unity scenes are tied to **Twine Passage names**.
*   If you have a passage in Twine named `Combat`, Theyr will look for a Unity scene named exactly `Combat`.
*   When the player clicks a link in Twine, Unity will automatically load the matching scene.

---

## 💻 Advanced: Using the C# API
If you are writing custom C# scripts, you can access the state directly:

```csharp
public GameStateSO gameState;

void Update() {
    // Get a simple variable
    int score = gameState.Get<int>("globalCounter");

    // Get a nested variable
    string name = gameState.Get<string>("users.alice.name");
}
```

To send data back to the server:
```csharp
public StateBridge bridge;

void WinGame() {
    bridge.ThSet("$winner", "Player 1"); // Absolute set
    bridge.ThAdd("$score", 10);          // Atomic add (safer)
}
```
