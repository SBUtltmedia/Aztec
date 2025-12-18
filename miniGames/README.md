# Aztec Mini-Games Integration Guide

This guide provides instructions for integrating new mini-games into a responsive, fixed-aspect-ratio layout and enabling communication with a parent frame. This allows the games to scale correctly on any screen and report results back to the main application.

There are two primary features to implement:
1.  **Responsive Layout Engine**: Makes the game scale like a photograph, maintaining a 16:9 aspect ratio.
2.  **Parent Frame Communication**: Allows the game to send data (like score updates) to the parent window that embeds it.

---

## 1. Implementing the Responsive Layout Engine

This ensures your game looks consistent across all screen sizes by scaling it within a fixed 16:9 container.

### Step 1: Update HTML Structure

Wrap the entire visible content of your game within a single `div` with the ID `main-container`.

**Example:**
```html
<body>
  <div id="main-container">
    <!-- All your game's HTML content goes here -->
    <div class="game-screen">...</div>
    <div class="game-over-screen">...</div>
  </div>
  <script>
    // Your game logic
  </script>
</body>
```

### Step 2: Add CSS Styles

Add the following CSS to your game's `<style>` block. This will control the `body` and the new `#main-container`.

```css
/* --- LAYOUT ENGINE STYLES --- */
body {
    margin: 0;
    overflow: hidden;
    background-color: #111; /* Color for the letterbox bars */
    font-family: 'Inter', sans-serif; /* Or your preferred font */
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
}

#main-container {
    position: absolute;
    /* Add your game's background here */
    background-image: url('your-background-image.jpg');
    background-color: #your-fallback-color;
    background-size: cover;
    background-position: center;
    overflow: hidden;
    box-shadow: 0 0 3rem rgba(0,0,0,0.5);
    transition: all 0.2s ease-in-out;
}
```

### Step 3: Convert All Sizing to `rem` Units

This is the most critical step for correct scaling. The layout engine works by changing the root font size (`rem`) based on the container's width. Therefore, all sizes in your CSS must be in `rem` to scale proportionally.

**Conversion Rule:**
Decide on a reference design width (e.g., `1000px`). At this width, `1rem` will equal `10px`.
To convert from `px` to `rem`, divide the `px` value by `10`.

**Example:**
- `font-size: 16px;` becomes `font-size: 1.6rem;`
- `padding: 20px;` becomes `padding: 2rem;`
- `border-radius: 8px;` becomes `border-radius: 0.8rem;`
- `width: 500px;` becomes `width: 50rem;`

Go through your entire stylesheet and update all `px`, `vw`, `vh`, `%` (where appropriate), and other units to `rem`.

### Step 4: Add the JavaScript Logic

Add the `resizeLayout` function and the corresponding event listeners to your game's main `<script>` tag.

```javascript
// --- 1. LAYOUT ENGINE LOGIC ---
function resizeLayout() {
    const mainContainer = document.getElementById('main-container');
    const htmlElement = document.documentElement;
    const ASPECT_RATIO = 16 / 9;
    let viewportWidth = window.innerWidth, viewportHeight = window.innerHeight;
    const viewportRatio = viewportWidth / viewportHeight;
    let containerWidth, containerHeight, top, left;
    if (viewportRatio > ASPECT_RATIO) {
        containerHeight = viewportHeight;
        containerWidth = containerHeight * ASPECT_RATIO;
        top = 0; left = (viewportWidth - containerWidth) / 2;
    } else {
        containerWidth = viewportWidth;
        containerHeight = containerWidth / ASPECT_RATIO;
        top = (viewportHeight - containerHeight) / 2; left = 0;
    }
    mainContainer.style.width = `${containerWidth}px`;
    mainContainer.style.height = `${containerHeight}px`;
    mainContainer.style.top = `${top}px`;
    mainContainer.style.left = `${left}px`;
    const rootFontSize = containerWidth / 100;
    htmlElement.style.fontSize = `${rootFontSize}px`;
}

// --- Add this to your initialization code ---
window.addEventListener('load', () => {
  resizeLayout();
  // ... your other init logic
});
window.addEventListener('resize', resizeLayout);
```

---

## 2. Implementing Parent Frame Communication

This allows the game to report scores or other outcomes back to the hosting page.

### Step 1: Add State Variable and `sendDeltaToParent` Function

In your game's main `<script>`, add a flag to prevent sending messages multiple times and the function to handle sending the message.

```javascript
let finalStateSent = false;

function sendDeltaToParent() {
    if (finalStateSent) return;
    if (window.parent && window.parent !== window) {
        // Construct your results object. 
        // This example assumes a single point is awarded to the highest scoring attribute.
        const winner = winnerCategory(); // You need a function to determine the result
        const delta = {
            strength: 0,
            wisdom: 0,
            charisma: 0,
            // ... any other attributes
        };
        if (winner) {
            delta[winner] = 1;
        }
        
        // Post the message
        window.parent.postMessage({ type: 'statsDeltaUpdate', delta: delta }, '*');
        finalStateSent = true;
        console.log("Final stat deltas sent to parent:", delta);
    } else {
        console.warn("Not in an iframe. Final state delta cannot be sent.");
    }
}
```
*Note: You must adapt the `delta` object to match the specific attributes your game modifies.*

### Step 2: Call the Function and Reset the Flag

- **Call `sendDeltaToParent()`** in the function where your game ends (e.g., `endGame()`).
- **Reset the `finalStateSent` flag** in the function where your game starts or restarts (e.g., `startGame()`).

**Example:**
```javascript
function startGame() {
  // ... your game start logic
  finalStateSent = false;
  // ...
}

function endGame() {
  // ... your game over logic
  show('outro');
  sendDeltaToParent(); // Call the function here
}
```

---

## 3. Testing with the Frameset

Use the provided `index.html` to test your implementation.

1.  Open `index.html` in a web browser. It should load your game in an iframe.
2.  Resize the browser window. Your game should scale proportionally within the black bars, with no distortion.
3.  Play the game to completion.
4.  When the game ends, a popup dialog should appear confirming that a message was received. The "Messages from Game" log on the page will also display the data that was sent.

If both scaling and the popup confirmation work, your integration is successful.
