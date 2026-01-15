// unityBridge.js - Handles persistent Unity WebGL connection

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

    // 2. Create the Container
    const container = document.createElement("div");
    container.id = CONTAINER_ID;
    
    // Style: Unity at top, fixed height
    Object.assign(container.style, {
        position: "fixed",
        top: "0",
        left: "0",
        width: "100%",
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

        // Send SugarCube State
        if (typeof State !== 'undefined' && State.variables) {
            try {
                const stateCopy = JSON.parse(JSON.stringify(State.variables));
                console.log("Unity Bridge: Sending State variables.");
                unityFrame.contentWindow.postMessage({
                    type: "STATE_UPDATE",
                    payload: stateCopy
                }, "*");
            } catch (e) {
                console.error("Unity Bridge: Failed to serialize State variables", e);
            }
        } else {
            console.warn("Unity Bridge: 'State' object not available yet.");
        }
    }
});

// Initialize on load
initUnityBridge();
