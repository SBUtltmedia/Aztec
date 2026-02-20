// unityBridge.js - Handles persistent Unity WebGL connection
//
// BIDIRECTIONAL COMMUNICATION:
// - Twine → Unity: Scene changes and state updates via postMessage
// - Unity → Server: State updates via postMessage → Socket.IO relay

// Configuration
const UNITY_BUILD_PATH = "/UnityWebGL/index.html"; // Path to your Unity Build
const CONTAINER_ID = "unity-container";
const IFRAME_ID = "unity-frame";

function initUnityBridge() {
    // 1. Idempotent Check: Don't create if it already exists
    if (document.getElementById(CONTAINER_ID)) {
        console.log("Unity Bridge: Container already exists.");
        return;
    }

    console.log("Unity Bridge: Initializing...");

    // Set up listener for messages FROM Unity (for server sync)
    initUnityToServerBridge();

    // 2. Create the Container
    const container = document.createElement("div");
    container.id = CONTAINER_ID;
    
    // Style: Unity at top, fixed height
    Object.assign(container.style, {
        position: "absolute",
        top: "10px",
        left: "180px",
        width: "95%",
        height: "300px",  // Unity takes top 300px
        zIndex: "1",
        pointerEvents: "none", // Let clicks pass through to Twine
        border: "none",
        overflow: "hidden"
    });

    // Add CSS to position Twine passage below Unity
    const style = document.createElement('style');
    style.textContent = `
        body {
            padding-top: 320px; /* Make room for Unity at top (300px + 20px margin) */
        }

        #passages {
            position: relative;
            z-index: 2;
            background-color: #1a1a1a !important; /* Dark background */
            padding: 20px;
            border-radius: 10px;
            max-width: 900px;
            margin: 0 auto 20px auto;
        }

        .passage {
            color: white;
            text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
        }

        /* Make links visible */
        .passage a {
            color: #6cf;
            text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.9);
        }

        .passage a:hover {
            color: #9df;
        }
    `;
    document.head.appendChild(style);

    // 3. Create the Iframe
    const iframe = document.createElement("iframe");
    iframe.id = IFRAME_ID;
    iframe.src = UNITY_BUILD_PATH;
    
    Object.assign(iframe.style, {
        width: "100%",
        height: "100%",
        border: "0",
        display: "block"
    });

    container.appendChild(iframe);
    document.body.appendChild(container);
    console.log("Unity Bridge: Iframe injected.");
}

// 4. Listen for SugarCube Passage Navigation
$(document).on(":passagestart", function (ev) {
    const passageName = ev.passage.title;
    const unityFrame = document.getElementById(IFRAME_ID);

    if (unityFrame && unityFrame.contentWindow) {
        console.log(`Unity Bridge: Sending scene change -> '${passageName}'`);
        
        // Post message to the Unity Iframe
        unityFrame.contentWindow.postMessage({
            type: "SCENE_CHANGE",
            payload: passageName
        }, "*");

        // Send SugarCube State — always use window.SugarCube.State.variables (public API)
        // so this works whether or not 'State' is in the current closure scope.
        const scVars = window.SugarCube?.State?.variables;
        if (scVars !== undefined) {
            let stateCopy;
            try {
                stateCopy = JSON.parse(JSON.stringify(scVars));
            } catch (e) {
                console.warn("Unity Bridge: Full state serialization failed, trying per-key fallback:", e.message);
                // Fallback: serialize each variable individually, skipping non-serializable ones
                stateCopy = {};
                for (const key of Object.keys(scVars)) {
                    try {
                        stateCopy[key] = JSON.parse(JSON.stringify(scVars[key]));
                    } catch (_) {
                        console.warn(`Unity Bridge: Skipping non-serializable variable: ${key}`);
                    }
                }
            }
            console.log("Unity Bridge: Sending State variables.");
            unityFrame.contentWindow.postMessage({
                type: "STATE_UPDATE",
                payload: stateCopy
            }, "*");
        } else {
            console.warn("Unity Bridge: SugarCube State not available yet.");
        }
    }
});

// =========================================================================
// UNITY → SERVER: Listen for state updates from Unity and relay to Socket.IO
// =========================================================================

function initUnityToServerBridge() {
    window.addEventListener("message", function(event) {
        // Handle state updates from Unity (equivalent to <<th-set '$var' to value>>)
        if (event.data && event.data.type === "UNITY_STATE_UPDATE") {
            const { variable, value } = event.data.payload;
            console.log(`Unity Bridge: Received state update from Unity -> ${variable}`, value);

            // Update local SugarCube state via public API (window.SugarCube.State.variables)
            const scVarsState = window.SugarCube?.State?.variables;
            if (scVarsState !== undefined) {
                try {
                    const varName = variable.startsWith('$') ? variable.slice(1) : variable;
                    scVarsState[varName] = value;
                } catch (e) {
                    console.warn("Unity Bridge: Failed to set SugarCube variable", e);
                }
            }

            // Send to server via Socket.IO (if available)
            if (window.socket && window.socket.connected) {
                if (window.sendStateUpdate) {
                    window.sendStateUpdate(variable, value);
                } else {
                    // Fallback: emit directly
                    window.socket.emit('stateUpdate', {
                        variable: variable,
                        value: value,
                        userId: window.SugarCube?.State?.variables?.userId || 'unity'
                    });
                }
                console.log("Unity Bridge: Relayed state update to server");
            } else {
                console.warn("Unity Bridge: Socket not connected, state update not sent to server");
            }

            // Trigger liveupdate for any <<liveblock>> sections
            if(window.thLiveUpdate) window.thLiveUpdate(); else $(document).trigger(':liveupdate');
        }

        // Handle atomic updates from Unity (equivalent to <<th-set '$var' += value>>)
        if (event.data && event.data.type === "UNITY_ATOMIC_UPDATE") {
            const { variable, operation, value } = event.data.payload;
            console.log(`Unity Bridge: Received atomic update from Unity -> ${variable} ${operation} ${value}`);

            // Update local SugarCube state optimistically via public API
            const scVarsAtomic = window.SugarCube?.State?.variables;
            if (scVarsAtomic !== undefined) {
                try {
                    const varName = variable.startsWith('$') ? variable.slice(1) : variable;
                    const currentValue = Number(scVarsAtomic[varName] || 0);
                    let newValue = currentValue;

                    switch(operation) {
                        case 'add': newValue += value; break;
                        case 'subtract': newValue -= value; break;
                        case 'multiply': newValue *= value; break;
                        case 'divide': newValue /= value; break;
                        case 'modulus': newValue %= value; break;
                    }

                    scVarsAtomic[varName] = newValue;
                } catch (e) {
                    console.warn("Unity Bridge: Failed to apply atomic update to SugarCube", e);
                }
            }

            // Send to server via Socket.IO (if available)
            if (window.socket && window.socket.connected) {
                if (window.sendAtomicUpdate) {
                    window.sendAtomicUpdate(variable, operation, value);
                } else {
                    // Fallback: emit directly
                    window.socket.emit('atomicUpdate', {
                        variable: variable,
                        operation: operation,
                        value: value,
                        userId: window.SugarCube?.State?.variables?.userId || 'unity'
                    });
                }
                console.log("Unity Bridge: Relayed atomic update to server");
            } else {
                console.warn("Unity Bridge: Socket not connected, atomic update not sent to server");
            }

            // Trigger liveupdate for any <<liveblock>> sections
            if(window.thLiveUpdate) window.thLiveUpdate(); else $(document).trigger(':liveupdate');
        }
    });

    console.log("Unity Bridge: Unity→Server bridge initialized");
}

// =========================================================================
// SERVER → UNITY: Forward state updates from server to Unity
// =========================================================================

// Hook into socket.io 'difference' events to forward to Unity
function initServerToUnityBridge() {
    // Wait for socket to be available
    const checkSocket = setInterval(function() {
        if (window.socket) {
            clearInterval(checkSocket);

            // Listen for state updates from server
            window.socket.on('difference', function(diff) {
                const unityFrame = document.getElementById(IFRAME_ID);
                if (unityFrame && unityFrame.contentWindow) {
                    // Forward the server state update to Unity
                    unityFrame.contentWindow.postMessage({
                        type: "STATE_UPDATE",
                        payload: diff
                    }, "*");
                    console.log("Unity Bridge: Forwarded server state update to Unity", diff);
                }
            });

            console.log("Unity Bridge: Server→Unity bridge initialized");
        }
    }, 100);

    // Timeout after 10 seconds
    setTimeout(function() {
        clearInterval(checkSocket);
    }, 10000);
}

// Initialize on load
initUnityBridge();

// Initialize server→unity bridge (needs socket to be ready)
initServerToUnityBridge();
