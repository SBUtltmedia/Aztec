# Multiplayer Engine Demo

This is a simplified demonstration of the Twine/SugarCube multiplayer engine, stripped of all game-specific content to showcase the core multiplayer functionality.

## What This Demo Shows

1. **Server-Authoritative State** - Single source of truth on the server
2. **Real-Time Synchronization** - Changes broadcast instantly to all clients
3. **Persistent State** - Game state survives server restarts
4. **Exception Variables** - Client-only variables that never sync
5. **The `th-set` Macro** - Custom SugarCube macro for multiplayer variable updates

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Start the Demo

```bash
# Start the server
npm run dev

# In another terminal, watch for Twine changes and auto-compile
node tweeGazeDemo.js
```

### 3. Open in Browser

Navigate to: `http://localhost:53134/Twine/EngineDemo.html?id=yourname`

For multiplayer testing, open multiple tabs with different user IDs:
- Tab 1: `http://localhost:53134/Twine/EngineDemo.html?id=alice`
- Tab 2: `http://localhost:53134/Twine/EngineDemo.html?id=bob`
- Tab 3: `http://localhost:53134/Twine/EngineDemo.html?id=charlie`

## Demo Features

### 🔢 Shared Counter Demo
- Increment/decrement a counter that syncs across all clients
- Demonstrates basic `th-set` usage
- Shows compound operators (`+=`, `-=`)

### 💬 Message Board Demo
- Post messages that all players can see
- Demonstrates array manipulation
- Shows real-time list updates with `<<liveblock>>`

### 👥 User Registry Demo
- Track all users who have visited
- Update individual user scores
- Demonstrates nested object paths (`$users[$userId].score`)

## Key Concepts

### Exception Variables (Local-Only)

These variables are stored locally on each client and NEVER synced to the server:

```javascript
window.exceptions = ['$userId', '$god', '$godParam', '$passageHistory'];
```

Use regular `<<set>>` for these:
```twine
<<set $userId to "alice">>
```

### Shared Variables (Synced)

All other variables are synchronized across clients using `<<th-set>>`:

```twine
<<th-set '$sharedCounter' to 42>>
<<th-set '$sharedCounter' += 10>>
<<th-set '$users[$userId].score' to 100>>
```

### Live Updates

Wrap content in `<<liveblock>>` to auto-update when shared state changes:

```twine
<<liveblock>>
Counter: $sharedCounter
<</liveblock>>
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                             │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           SugarCube/Twine Story                      │  │
│  │                                                      │  │
│  │  <<th-set '$counter' to 42>>  ──┐                   │  │
│  │                                  │                   │  │
│  │  <<liveblock>>                   │                   │  │
│  │    Counter: $counter  ←──────────┼─────────┐        │  │
│  │  <</liveblock>>                  │         │        │  │
│  └──────────────────────────────────┼─────────┼────────┘  │
│                                     │         │            │
│  ┌──────────────────────────────────▼─────────┼────────┐  │
│  │           ClientDemo.js                    │        │  │
│  │                                            │        │  │
│  │  - Socket.IO client                        │        │  │
│  │  - Exception variable filtering            │        │  │
│  │  - State update handler                    │        │  │
│  └──────────────────────────────────┬─────────┘        │  │
│                                     │                    │  │
└─────────────────────────────────────┼────────────────────┘
                                      │
                            Socket.IO │ WebSocket
                                      │
┌─────────────────────────────────────▼────────────────────┐
│                      Node.js Server                       │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              Webstack.js                            │ │
│  │                                                     │ │
│  │  - Express HTTP server                             │ │
│  │  - Socket.IO server                                │ │
│  │  - Server Store (single source of truth)           │ │
│  │  - Mutex for race condition prevention             │ │
│  └─────────────────────┬───────────────────────────────┘ │
│                        │                                  │
│  ┌─────────────────────▼───────────────────────────────┐ │
│  │              gitApiIO.js                            │ │
│  │                                                     │ │
│  │  - State persistence                               │ │
│  │  - Local: login/testVars.json                      │ │
│  │  - Production: GitHub API                          │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

## File Structure

```
Aztec/
├── Twine/
│   ├── EngineDemo/
│   │   └── 00_Setup.twee          # Demo story with th-set macro
│   └── EngineDemo.html             # Compiled output
├── static/
│   └── ClientDemo.js               # Simplified Socket.IO client
├── Webstack.js                     # Server (unchanged)
├── gitApiIO.js                     # State persistence (unchanged)
├── tweeGazeDemo.js                 # Build script for demo
├── login/
│   ├── index.js                    # Dev entry point
│   └── testVars.json               # Local state storage
└── DEMO_README.md                  # This file
```

## The `th-set` Macro

The heart of the multiplayer engine. Located in `Twine/EngineDemo/00_Setup.twee`.

### Basic Usage

```twine
<<th-set '$variableName' to value>>
```

### Features

- ✅ Simple assignment: `<<th-set '$x' to 42>>`
- ✅ Compound operators: `<<th-set '$x' += 10>>`
- ✅ Nested paths: `<<th-set '$users[$id].score' to 100>>`
- ✅ Expressions: `<<th-set '$x' to $y + $z * 2>>`
- ✅ Auto-sync to server (except exception variables)

### Implementation

1. Parses the expression
2. Evaluates the value
3. Sets locally in SugarCube
4. Sends to server via Socket.IO
5. Server broadcasts to all clients
6. Clients update their local state
7. `<<liveblock>>` sections re-render

## Testing Multiplayer

### Single User Testing

Even with one user, you'll see evidence of multiplayer:
- Previous visitors' data in User Registry
- Messages on the Message Board
- Persistent counter value

### Multi-Tab Testing

1. Open Tab 1: `?id=alice`
2. Open Tab 2: `?id=bob`
3. Increment counter in Tab 1
4. Watch it update in Tab 2 immediately!

### Network Testing

Open on different devices on the same network:
- Computer: `http://YOUR_IP:53134/Twine/EngineDemo.html?id=computer`
- Phone: `http://YOUR_IP:53134/Twine/EngineDemo.html?id=phone`

## Differences from Main Game

### Removed
- ❌ All Aztec-specific content (factions, characters, story)
- ❌ `$role` variable (replaced with `$userId`)
- ❌ Complex user initialization
- ❌ Faction-specific logic
- ❌ Background images and game-specific styling
- ❌ Minimum player requirements
- ❌ Quest systems

### Kept
- ✅ `th-set` macro (core functionality)
- ✅ Socket.IO synchronization
- ✅ Server Store
- ✅ Exception variable filtering
- ✅ State persistence (gitApiIO)
- ✅ Mutex-based race condition handling
- ✅ `<<liveblock>>` real-time updates

### Simplified
- 🔧 Single `$userId` instead of `$role` + `$userId`
- 🔧 Simple user objects (name, score, visits, lastAction)
- 🔧 No faction requirements or multiplayer gates
- 🔧 Minimal styling (dark theme only)

## Common Tasks

### Reset Game State

```bash
# Delete the state file
rm login/testVars.json

# Restart server
# State will be recreated from initVars.json
```

### Modify the Demo

1. Edit `Twine/EngineDemo/00_Setup.twee`
2. Save (tweeGazeDemo.js auto-compiles)
3. Refresh browser

### Add New Passages

Add new `::` passages in `00_Setup.twee`:

```twine
:: My New Passage
<<liveblock>>
My content here with $sharedVariables
<</liveblock>>

[[Link to other passage|Hub]]
```

### Add New Shared Variables

```twine
:: Start
<<if !$myNewVariable>>
    <<th-set '$myNewVariable' to "initial value">>
<</if>>
```

## Troubleshooting

### Changes Don't Appear

1. Check tweeGazeDemo.js is running
2. Check for compilation errors in terminal
3. Hard refresh browser (Cmd+Shift+R / Ctrl+Shift+F5)

### State Not Syncing

1. Check browser console for Socket.IO errors
2. Verify server is running (`npm run dev`)
3. Check `login/testVars.json` exists

### "Socket not connected" Errors

1. Ensure server started successfully
2. Check port 53134 is not in use
3. Look for firewall blocking WebSocket connections

## Extending the Demo

Want to add your own multiplayer features?

1. Add new shared variables with `<<th-set>>`
2. Wrap dynamic content in `<<liveblock>>`
3. Use `$userId` to track which user did what
4. Store user-specific data in `$users[$userId]`

Example - Add a vote system:

```twine
<<if !$votes>>
    <<th-set '$votes' to {option1: 0, option2: 0}>>
<</if>>

<<button "Vote Option 1">>
    <<th-set '$votes.option1' += 1>>
    <<th-set '$users[$userId].lastAction' to "Voted for Option 1">>
<</button>>

<<liveblock>>
Option 1: $votes.option1 votes
Option 2: $votes.option2 votes
<</liveblock>>
```

## Production Deployment

For deploying to Heroku or other platforms:

1. Use `npm start` instead of `npm run dev`
2. Set `PORT` environment variable
3. Configure GitHub token for state persistence
4. See main project README for full deployment guide

## License

Same as main project.

## Questions?

This demo is designed to be self-explanatory, but if you have questions about the multiplayer engine implementation, check the "About the Engine" passage in the demo itself!
