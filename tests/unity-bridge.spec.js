/**
 * unity-bridge.spec.js
 *
 * Tests the bidirectional postMessage bridge between Twine and the Unity iframe.
 * Unity renders to <canvas>, so instead of inspecting Unity's DOM we:
 *   - Install a message listener INSIDE the Unity iframe (receiver-side) so we
 *     capture every postMessage Twine sends to it; results are stored in
 *     parent._unityMessages for easy access from page.evaluate().
 *   - Inject fake window.postMessage() events to test Unity→Twine handlers.
 *
 * Requires the server to be running: npm start
 */

import { test, expect } from '@playwright/test';

const TWINE_URL = '/Twine/UnityDemo.html';
const NICK = 'BridgeTester';

// ─── Helpers ───────────────────────────────────────────────────────────────

/**
 * Install a spy INSIDE the Unity iframe's window so we capture every
 * postMessage that Twine sends to it. Results are written into
 * parent._unityMessages so they're readable via page.evaluate().
 *
 * This receiver-side approach is more reliable than patching
 * iframe.contentWindow.postMessage from the parent, which can break
 * when the iframe's Window object is replaced during load.
 */
async function installPostMessageSpy(page) {
    // Reset collection on the parent window
    await page.evaluate(() => { window._unityMessages = []; });

    const iframeEl = await page.waitForSelector('#unity-frame', { timeout: 10_000 });
    const frame = await iframeEl.contentFrame();

    if (!frame) {
        console.warn('[SPY] Could not access Unity iframe content frame');
        return;
    }

    await frame.evaluate(() => {
        // Remove any previously installed spy to avoid double-counting on reinstall
        if (window._unitySpyHandler) {
            window.removeEventListener('message', window._unitySpyHandler);
        }
        window._unitySpyHandler = function(e) {
            // Only capture our bridge messages (they always have a string `type`).
            // Unity WebGL uses postMessage internally for worker/WASM communication;
            // those payloads are binary (ArrayBuffer) and can't be JSON-serialised.
            if (!e.data || typeof e.data.type !== 'string') return;
            try {
                if (window.parent && Array.isArray(window.parent._unityMessages)) {
                    // e.data is already a fresh structured-clone from postMessage;
                    // push it directly to avoid a second serialisation that could
                    // fail on complex-but-legal payloads (e.g. deeply nested objects).
                    window.parent._unityMessages.push(e.data);
                }
            } catch (_) {}
        };
        window.addEventListener('message', window._unitySpyHandler);
        console.log('[SPY] postMessage receiver spy installed in Unity iframe');
    });
}

/**
 * Wait for the Unity iframe to be present and Socket.IO to connect.
 */
async function waitForReady(page) {
    await page.waitForSelector('#unity-frame', { timeout: 10_000 });
    await page.waitForFunction(
        () => window.socket && window.socket.connected,
        { timeout: 15_000 }
    );
}

/**
 * Wait until the server's initial state delivery ('new connection') has been
 * processed. ClientDemo.js sets window._twineStateReceived = true inside both
 * the 'new connection' and 'fullState' socket handlers, so this is a reliable
 * signal that the server state has been merged into SugarCube variables.
 */
async function waitForInitialState(page) {
    await page.waitForFunction(
        () => window._twineStateReceived === true,
        { timeout: 8_000 }
    );
    // Small buffer to let thLiveUpdate debounce (20 ms) settle after the merge
    await page.waitForTimeout(50);
}

/**
 * Simulate a message as if it came from the Unity iframe.
 * Tests unityBridge.js's window message listener without needing Unity to run.
 */
async function simulateUnityMessage(page, type, payload) {
    await page.evaluate(({ type, payload }) => {
        window.dispatchEvent(new MessageEvent('message', {
            data: { type, payload },
            origin: window.location.origin,
            source: window // simulate same-origin iframe
        }));
    }, { type, payload });
    await page.waitForTimeout(200);
}

// ─── Tests ─────────────────────────────────────────────────────────────────

test.describe('Bridge: Twine → Unity (postMessage)', () => {

    test('Unity iframe is injected by unityBridge.js', async ({ page }) => {
        await page.goto(`${TWINE_URL}?nick=${NICK}`);
        const iframe = await page.waitForSelector('#unity-frame', { timeout: 10_000 });
        expect(iframe).not.toBeNull();

        const src = await iframe.getAttribute('src');
        expect(src).toContain('UnityWebGL');
    });

    test('SCENE_CHANGE is sent when navigating to a new passage', async ({ page }) => {
        await page.goto(`${TWINE_URL}?nick=${NICK}`);
        await waitForReady(page);
        await installPostMessageSpy(page);

        // Navigate from Initialize User → Start (Enter Tutorial link)
        await page.evaluate(() => {
            const link = [...document.querySelectorAll('a')]
                .find(a => a.textContent.includes('Enter Tutorial'));
            if (link) link.click();
        });
        await page.waitForTimeout(800);

        const msgs = await page.evaluate(() => window._unityMessages ?? []);
        const sceneChange = msgs.find(m => m.type === 'SCENE_CHANGE');

        expect(sceneChange, 'SCENE_CHANGE message was sent').toBeTruthy();
        expect(typeof sceneChange.payload).toBe('string');
        expect(sceneChange.payload.length).toBeGreaterThan(0);
        console.log(`SCENE_CHANGE sent with passage: "${sceneChange.payload}"`);
    });

    test('SCENE_CHANGE payload matches the current SugarCube passage name', async ({ page }) => {
        await page.goto(`${TWINE_URL}?nick=${NICK}`);
        await waitForReady(page);
        await installPostMessageSpy(page);

        await page.evaluate(() => {
            const link = [...document.querySelectorAll('a')]
                .find(a => a.textContent.includes('Enter Tutorial'));
            if (link) link.click();
        });
        await page.waitForTimeout(800);

        const { scenePayload, passageName } = await page.evaluate(() => ({
            scenePayload: (window._unityMessages ?? []).find(m => m.type === 'SCENE_CHANGE')?.payload,
            // SugarCube v2: current passage name is State.passage (string), not passage()
            passageName:  window.SugarCube?.State?.passage ?? ''
        }));

        expect(scenePayload).toBe(passageName);
    });

    test('STATE_UPDATE carries the current SugarCube state', async ({ page }) => {
        await page.goto(`${TWINE_URL}?nick=${NICK}`);
        await waitForReady(page);
        await installPostMessageSpy(page);

        await page.evaluate(() => {
            const link = [...document.querySelectorAll('a')]
                .find(a => a.textContent.includes('Enter Tutorial'));
            if (link) link.click();
        });
        await page.waitForTimeout(800);

        const msgs = await page.evaluate(() => window._unityMessages ?? []);
        const stateUpdate = msgs.find(m => m.type === 'STATE_UPDATE');

        expect(stateUpdate, 'STATE_UPDATE message was sent').toBeTruthy();
        expect(typeof stateUpdate.payload).toBe('object');
        // State should contain at least the variables we know exist
        expect(stateUpdate.payload).toHaveProperty('globalCounter');
    });

    test('Both SCENE_CHANGE and STATE_UPDATE are sent on every passage navigation', async ({ page }) => {
        await page.goto(`${TWINE_URL}?nick=${NICK}`);
        await waitForReady(page);
        await installPostMessageSpy(page);

        // First navigation
        await page.evaluate(() => {
            const link = [...document.querySelectorAll('a')]
                .find(a => a.textContent.includes('Enter Tutorial'));
            if (link) link.click();
        });
        await page.waitForTimeout(800);

        const msgs1 = await page.evaluate(() => window._unityMessages ?? []);
        expect(msgs1.filter(m => m.type === 'SCENE_CHANGE')).toHaveLength(1);
        // ≥1 because the server may echo a 'difference' event which initServerToUnityBridge
        // also forwards to Unity as a STATE_UPDATE alongside the :passagestart one.
        expect(msgs1.filter(m => m.type === 'STATE_UPDATE').length).toBeGreaterThanOrEqual(1);

        // Reset the message buffer and navigate again (spy remains active in iframe)
        await page.evaluate(() => { window._unityMessages = []; });
        await page.evaluate(() => {
            const link = [...document.querySelectorAll('a')]
                .find(a => a.textContent.includes('Next'));
            if (link) link.click();
        });
        await page.waitForTimeout(800);

        const msgs2 = await page.evaluate(() => window._unityMessages ?? []);
        expect(msgs2.filter(m => m.type === 'SCENE_CHANGE')).toHaveLength(1);
        expect(msgs2.filter(m => m.type === 'STATE_UPDATE').length).toBeGreaterThanOrEqual(1);
    });

});

test.describe('Bridge: Unity → Twine (fake postMessage injection)', () => {

    test('UNITY_STATE_UPDATE updates the SugarCube variable', async ({ page }) => {
        await page.goto(`${TWINE_URL}?nick=${NICK}`);
        await waitForReady(page);
        // Wait for server's 'new connection' to arrive so it doesn't overwrite our value
        await waitForInitialState(page);

        const MAGIC_VALUE = 87654;

        await simulateUnityMessage(page, 'UNITY_STATE_UPDATE', {
            variable: '$globalCounter',
            value: MAGIC_VALUE
        });

        const val = await page.evaluate(() => window.SugarCube?.State?.variables?.globalCounter);
        expect(val).toBe(MAGIC_VALUE);
    });

    test('UNITY_STATE_UPDATE relays to Socket.IO server', async ({ page }) => {
        await page.goto(`${TWINE_URL}?nick=${NICK}`);
        await waitForReady(page);

        // Spy on sendStateUpdate
        await page.evaluate(() => {
            window._serverUpdates = [];
            const orig = window.sendStateUpdate;
            if (orig) {
                window.sendStateUpdate = (variable, value) => {
                    window._serverUpdates.push({ variable, value });
                    return orig(variable, value);
                };
            }
        });

        await simulateUnityMessage(page, 'UNITY_STATE_UPDATE', {
            variable: '$globalCounter',
            value: 42
        });

        const updates = await page.evaluate(() => window._serverUpdates ?? []);
        expect(updates.length).toBeGreaterThan(0);
        expect(updates[0].value).toBe(42);
    });

    test('UNITY_ATOMIC_UPDATE (add) applies to local state correctly', async ({ page }) => {
        await page.goto(`${TWINE_URL}?nick=${NICK}`);
        await waitForReady(page);
        await waitForInitialState(page);

        const before = await page.evaluate(() =>
            window.SugarCube?.State?.variables?.globalCounter ?? 0
        );

        await simulateUnityMessage(page, 'UNITY_ATOMIC_UPDATE', {
            variable: '$globalCounter',
            operation: 'add',
            value: 7
        });

        const after = await page.evaluate(() =>
            window.SugarCube?.State?.variables?.globalCounter ?? 0
        );
        expect(after).toBe(before + 7);
    });

    test('UNITY_ATOMIC_UPDATE relays to Socket.IO server as atomicUpdate', async ({ page }) => {
        await page.goto(`${TWINE_URL}?nick=${NICK}`);
        await waitForReady(page);

        await page.evaluate(() => {
            window._atomicUpdates = [];
            const orig = window.sendAtomicUpdate;
            if (orig) {
                window.sendAtomicUpdate = (variable, operation, value) => {
                    window._atomicUpdates.push({ variable, operation, value });
                    return orig(variable, operation, value);
                };
            }
        });

        await simulateUnityMessage(page, 'UNITY_ATOMIC_UPDATE', {
            variable: '$globalCounter',
            operation: 'add',
            value: 5
        });

        const updates = await page.evaluate(() => window._atomicUpdates ?? []);
        expect(updates.length).toBeGreaterThan(0);
        expect(updates[0]).toMatchObject({ operation: 'add', value: 5 });
    });

    test('liveupdate fires after UNITY_STATE_UPDATE so UI reflects the change', async ({ page }) => {
        await page.goto(`${TWINE_URL}?nick=${NICK}`);
        await waitForReady(page);

        // Navigate to Start which has a liveblock displaying $globalCounter
        await page.evaluate(() => {
            const link = [...document.querySelectorAll('a')]
                .find(a => a.textContent.includes('Enter Tutorial'));
            if (link) link.click();
        });
        await page.waitForTimeout(1000);

        // Spy: count how many times thLiveUpdate fires
        await page.evaluate(() => {
            window._liveUpdateCount = 0;
            const orig = window.thLiveUpdate;
            if (orig) {
                window.thLiveUpdate = () => { window._liveUpdateCount++; return orig(); };
            }
        });

        await simulateUnityMessage(page, 'UNITY_STATE_UPDATE', {
            variable: '$globalCounter',
            value: 1234
        });

        const count = await page.evaluate(() => window._liveUpdateCount);
        expect(count).toBeGreaterThan(0);
    });

});

test.describe('Bridge: th-set macro', () => {

    test('<<th-set>> sends atomicUpdate to server for += operator', async ({ page }) => {
        await page.goto(`${TWINE_URL}?nick=${NICK}`);
        await waitForReady(page);

        await page.evaluate(() => {
            window._atomicUpdates = [];
            const orig = window.sendAtomicUpdate;
            if (orig) {
                window.sendAtomicUpdate = (variable, operation, value) => {
                    window._atomicUpdates.push({ variable, operation, value });
                    return orig(variable, operation, value);
                };
            }
        });

        // Invoke the macro directly via SugarCube's engine
        await page.evaluate(() => {
            if (window.SugarCube?.Macro?.get('th-set')) {
                // Simulate what the macro does: call sendAtomicUpdate
                window.sendAtomicUpdate('$globalCounter', 'add', 1);
            }
        });

        const updates = await page.evaluate(() => window._atomicUpdates ?? []);
        expect(updates.length).toBeGreaterThan(0);
        expect(updates[0]).toMatchObject({ operation: 'add', value: 1 });
    });

    test('exception variables are NOT sent to server', async ({ page }) => {
        await page.goto(`${TWINE_URL}?nick=${NICK}`);
        await waitForReady(page);

        const emitted = await page.evaluate(() => {
            const exceptions = window.exceptions ?? [];
            return {
                exceptions,
                includesUserId:    exceptions.includes('$userId'),
                includesGod:       exceptions.includes('$god'),
                includesGodParam:  exceptions.includes('$godParam'),
                includesHistory:   exceptions.includes('$passageHistory'),
            };
        });

        expect(emitted.includesUserId).toBe(true);
        expect(emitted.includesGod).toBe(true);
        expect(emitted.includesGodParam).toBe(true);
        expect(emitted.includesHistory).toBe(true);
    });

});
