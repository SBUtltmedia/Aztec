# Server-Authoritative Architecture for Multiplayer

This document outlines the refactored architecture for handling multiplayer state in the Aztec project. The goal is to move from a complex client-side synchronization model to a more robust and standard server-authoritative model.

## 1. Problem Statement

The original multiplayer model attempted to synchronize state by having each client report its changes to the server. This leads to significant challenges:

- **Race Conditions:** If two players perform an action at the same time, it's difficult to determine the correct final state.
- **State Integrity:** It's hard to ensure every player has an identical copy of the game state at all times.
- **Complexity:** The client-side proxy logic required to intercept all state changes is complex and prone to breaking.

The **Server-Authoritative Model** solves these issues by establishing the server as the single source of truth for all game state.

## 2. Core Principles

1.  **The Server is the Source of Truth:** The Node.js server holds the master copy of the game state in its `serverStore`. The state in each player's browser is considered a temporary, local copy.
2.  **Client Actions are Intents:** When a player makes a choice in Twine, the game does **not** change its own state directly. Instead, it sends a message to the server describing the player's intended action (e.g., "I want to set `$Aguilar_1` to `'Yes'`").
3.  **Server Updates and Broadcasts:** The server receives the action, validates it, and applies it to the master game state. It then broadcasts the complete, new, authoritative state to **all** connected players.
4.  **Clients Synchronize and Render:** All clients, including the one who initiated the action, receive the new state from the server. They overwrite their local SugarCube state with the new state and re-render the display.

## 3. Implementation Details

This model was implemented via changes to both the server and the client.

### Server-Side (`loginDiscord/index.js`)

A new endpoint, `/action`, was added to handle incoming player intents.

```javascript
app.post('/action', urlencodedParser, (req, res) => {
    const { variable, value } = req.body;
    const state = webstackInstance.serverStore.getState();

    // Use lodash to safely set a value on a nested path
    _.set(state, variable.substring(1), value);

    webstackInstance.serverStore.setState(state);

    // Broadcast the entire new state to all clients
    webstackInstance.io.emit('state-update', state);

    res.send({ status: 'ok' });
});
```

### Client-Side (`Aztec.twee`)

Three changes were made to the client:

**A. Disable the Old Proxy System:** The old `State = new Proxy(...)` line in the `Story JavaScript` was disabled, as it conflicts with this new model.

**B. Add a Server Update Listener:** The following code was added to the `Story JavaScript` to listen for broadcasts from the server and update the local game state.

```javascript
// Listen for state updates from the server
if (window.socket) {
    window.socket.on('state-update', function(newState) {
        console.log("Received state update from server.");
        State.variables = newState;
        Engine.show(); // Re-render the passage with the new state
    });
}
```

**C. Create the `<<sendAction>>` Macro:** A new macro was created to send actions to the server. All state-changing operations in the Twine story must be converted to use this macro.

```javascript
Macro.add('sendAction', {
    handler: function() {
        if (this.args.length < 2) {
            return this.error('sendAction macro needs at least two arguments: variable path and value');
        }
        const varPath = this.args[0];
        const varValue = this.args[1];

        // This sends the intended action to the server.
        $.post("/action", { variable: varPath, value: varValue });
    }
});
```

### Passage Refactoring Example

To use the new system, passages must be refactored. 

**Before:**
```twee
<<link "The great coastal city of Tulum" "Aguilar Quest">><<set $Aguilar_1="Yes">><</link>>
```

**After:**
```twee
<<link "The great coastal city of Tulum" "Aguilar Quest">><<sendAction "$Aguilar_1" "Yes">><</link>>
```

## 4. Next Steps & Problematic Patterns

To complete the conversion, all state-changing macros in the story must be replaced with `<<sendAction>>`. You must pay special attention to the following patterns:

- **Operators (`+=`, `-=`)**: These require a more advanced `sendAction` macro that can send the *operation type* to the server to prevent race conditions.
- **`<<textbox>>` Macro**: This macro binds an input field directly to a variable. It must be replaced with a standard HTML `<input>` and a custom JavaScript event listener that calls `<<sendAction>>`.
- **Temporary Variables (`_variable`)**: Any `<<set>>` command that uses a temporary variable (starting with an underscore) should **not** be converted, as this state is local to the passage and should not be synchronized.

## 5. Alternative Refactoring Strategy: Wrapper Macros

To minimize the visual changes within the passage code and make the refactoring process easier, an alternative strategy is to create custom "wrapper" macros that mimic the original SugarCube macros but contain the server-communication logic.

### `<<th-textbox>>`

This is an ideal candidate for a wrapper. A `<<th-textbox>>` macro can be created to accept the exact same arguments as the original `<<textbox>>`. Internally, it would render a standard HTML `<input>` element and attach an `onchange` event listener to it. This listener would then call the `$.post("/action", ...)` logic.

This approach allows for a simple find-and-replace of `<<textbox` with `<<th-textbox` throughout the story files.

### `<<th-set>>`

This is more complex. The built-in `<<set>>` macro evaluates any valid JavaScript assignment expression, which is difficult to replicate perfectly in a custom macro. A more robust approach is to create a `<<th-set>>` macro with a slightly more explicit syntax that is safer for multiplayer.

**Example:**

*   **Original:** `<<set $player.score += 1>>`
*   **Proposed Wrapper:** `<<th-set '$player.score' to $player.score + 1>>`

This syntax is closer to the original and more readable than `<<sendAction>>`, but it still requires a careful, manual update for each use rather than a simple find-and-replace. It makes the intent clearer in the passage code while still being robust enough to be handled by the server-authoritative model.
