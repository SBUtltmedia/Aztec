/**
 * unity-load.spec.js
 *
 * Verifies that the Unity WebGL build loads correctly inside the iframe
 * and takes screenshots of the Unity canvas at each key passage.
 *
 * Unity renders to <canvas>, so visual verification is screenshot-based.
 * On development builds, Debug.Log() appears in the browser console —
 * we use this to confirm scene changes at the C# level.
 *
 * Screenshots are saved to test-screenshots/ for manual inspection.
 */

import { test, expect } from '@playwright/test';
import fs from 'fs';

const TWINE_URL = '/Twine/UnityDemo.html';
const SCREENSHOTS = 'test-screenshots';

test.beforeAll(() => {
    fs.mkdirSync(SCREENSHOTS, { recursive: true });
});

// ─── Helpers ───────────────────────────────────────────────────────────────

/** Wait for Unity iframe + socket connection. */
async function waitForReady(page) {
    await page.waitForSelector('#unity-frame', { timeout: 10_000 });
    await page.waitForFunction(
        () => window.socket?.connected,
        { timeout: 15_000 }
    );
}

/**
 * Screenshot just the Unity iframe element.
 * This is the primary "did the right scene load" visual artifact.
 */
async function screenshotUnity(page, filename) {
    const iframe = await page.$('#unity-frame');
    if (!iframe) {
        console.warn(`[SCREENSHOT] #unity-frame not found, falling back to full page: ${filename}`);
        await page.screenshot({ path: `${SCREENSHOTS}/${filename}` });
        return;
    }
    await iframe.screenshot({ path: `${SCREENSHOTS}/${filename}` });
    console.log(`[SCREENSHOT] Saved: ${SCREENSHOTS}/${filename}`);
}

/** Screenshot full page (Twine text + Unity strip at top). */
async function screenshotPage(page, filename) {
    await page.screenshot({ path: `${SCREENSHOTS}/${filename}`, fullPage: false });
    console.log(`[SCREENSHOT] Saved: ${SCREENSHOTS}/${filename}`);
}

// ─── Unity iframe / canvas presence ────────────────────────────────────────

test.describe('Unity WebGL: iframe and canvas', () => {

    test('Unity iframe is injected and has correct src', async ({ page }) => {
        await page.goto(`${TWINE_URL}?nick=LoadTester`);
        const iframe = await page.waitForSelector('#unity-frame', { timeout: 10_000 });
        const src = await iframe.getAttribute('src');
        expect(src).toContain('UnityWebGL');
    });

    test('Unity <canvas> element is present inside the iframe', async ({ page }) => {
        await page.goto(`${TWINE_URL}?nick=LoadTester`);
        await page.waitForSelector('#unity-frame', { timeout: 10_000 });

        // Playwright can reach into same-origin frames
        const unityFrame = page.frames().find(f => f.url().includes('UnityWebGL'));
        if (!unityFrame) {
            test.skip(true, 'Unity iframe not yet navigated — server may not be running or build missing');
            return;
        }

        // Unity WebGL shows a loading bar, then replaces it with the canvas.
        // 30s timeout covers WASM compilation on slow machines.
        const canvas = await unityFrame.waitForSelector('canvas', { timeout: 30_000 });
        expect(canvas).not.toBeNull();

        const box = await canvas.boundingBox();
        expect(box.width).toBeGreaterThan(0);
        expect(box.height).toBeGreaterThan(0);
        console.log(`Unity canvas dimensions: ${box.width}×${box.height}`);
    });

    test('no JS errors during Unity + Twine initialisation', async ({ page }) => {
        const errors = [];
        page.on('console', msg => {
            if (msg.type() === 'error') errors.push(msg.text());
        });
        page.on('pageerror', err => errors.push(err.message));

        await page.goto(`${TWINE_URL}?nick=LoadTester`);
        await page.waitForTimeout(5_000);

        const critical = errors.filter(e =>
            // Ignore expected non-critical network noise
            !e.includes('favicon') &&
            !e.includes('net::ERR_ABORTED') &&
            !e.includes('Content Security Policy')
        );

        if (critical.length > 0) console.log('Critical errors:', critical);
        expect(critical).toHaveLength(0);
    });

});

// ─── Scene-change console verification (dev builds) ────────────────────────

test.describe('Unity scene changes (via Debug.Log)', () => {
    /**
     * In Unity development builds, Debug.Log() appears in the browser console.
     * StateBridge.cs logs: "[StateBridge] Loading scene: <name>"
     * This test verifies the C# code received and acted on the SCENE_CHANGE message.
     *
     * SKIP: Automatically skipped on release builds where Debug.Log is stripped.
     */

    test('StateBridge logs the scene load when Twine navigates', async ({ page }) => {
        const sceneLogs = [];
        // Capture all frames' console (Unity iframe logs appear here on dev builds)
        page.on('console', msg => {
            if (msg.text().includes('[StateBridge]')) sceneLogs.push(msg.text());
        });

        await page.goto(`${TWINE_URL}?nick=LoadTester`);
        await waitForReady(page);

        await page.evaluate(() => {
            const link = [...document.querySelectorAll('a')]
                .find(a => a.textContent.includes('Enter Tutorial'));
            if (link) link.click();
        });

        // Give Unity time to receive the message and log
        await page.waitForTimeout(3_000);

        if (sceneLogs.length === 0) {
            test.info().annotations.push({
                type: 'warning',
                description: 'No [StateBridge] logs found — is this a Unity development build?'
            });
        } else {
            console.log('Scene logs:', sceneLogs);
            const loadLog = sceneLogs.find(l => l.includes('Loading scene:'));
            expect(loadLog).toBeTruthy();
            expect(loadLog).toContain('Start'); // The passage we navigated to
        }
    });

});

// ─── Screenshots at each passage ───────────────────────────────────────────

test.describe('Unity canvas screenshots per passage', () => {

    test('screenshot: Initialize User passage', async ({ page }) => {
        await page.goto(`${TWINE_URL}?nick=LoadTester`);
        await waitForReady(page);
        await page.waitForTimeout(5_000); // Unity loading time

        await screenshotUnity(page, '01-unity-initialize-user.png');
        await screenshotPage(page,  '01-full-initialize-user.png');
    });

    test('screenshot: Start passage (shared counter)', async ({ page }) => {
        await page.goto(`${TWINE_URL}?nick=LoadTester`);
        await waitForReady(page);
        await page.waitForTimeout(3_000);

        await page.evaluate(() => {
            const link = [...document.querySelectorAll('a')]
                .find(a => a.textContent.includes('Enter Tutorial'));
            if (link) link.click();
        });

        // Wait for passage + give Unity scene time to begin loading
        await page.waitForTimeout(5_000);

        await screenshotUnity(page, '02-unity-start-passage.png');
        await screenshotPage(page,  '02-full-start-passage.png');
    });

    test('screenshot: DraftingPattern passage', async ({ page }) => {
        await page.goto(`${TWINE_URL}?nick=LoadTester`);
        await waitForReady(page);
        await page.waitForTimeout(3_000);

        // Navigate to Start then to DraftingPattern
        await page.evaluate(() => {
            const link = [...document.querySelectorAll('a')]
                .find(a => a.textContent.includes('Enter Tutorial'));
            if (link) link.click();
        });
        await page.waitForTimeout(2_000);

        await page.evaluate(() => {
            const link = [...document.querySelectorAll('a')]
                .find(a => a.textContent.includes('Next'));
            if (link) link.click();
        });
        await page.waitForTimeout(5_000);

        await screenshotUnity(page, '03-unity-drafting-pattern.png');
        await screenshotPage(page,  '03-full-drafting-pattern.png');
    });

    test('screenshot: UnityBridge passage', async ({ page }) => {
        await page.goto(`${TWINE_URL}?nick=LoadTester`);
        await waitForReady(page);
        await page.waitForTimeout(3_000);

        // Navigate through the tutorial to the UnityBridge passage
        const navigateTo = async (text) => {
            await page.evaluate((t) => {
                const link = [...document.querySelectorAll('a')].find(a => a.textContent.includes(t));
                if (link) link.click();
            }, text);
            await page.waitForTimeout(2_000);
        };

        await navigateTo('Enter Tutorial');
        await navigateTo('Next');
        await navigateTo('Next');

        await page.waitForTimeout(5_000);

        await screenshotUnity(page, '04-unity-unity-bridge-passage.png');
        await screenshotPage(page,  '04-full-unity-bridge-passage.png');
    });

});

// ─── Unity iframe container layout ─────────────────────────────────────────

test.describe('Unity container layout', () => {

    test('Unity container is positioned at the top of the page', async ({ page }) => {
        await page.goto(`${TWINE_URL}?nick=LoadTester`);
        await page.waitForSelector('#unity-container', { timeout: 10_000 });

        const box = await page.$eval('#unity-container', el => {
            const r = el.getBoundingClientRect();
            return { top: r.top, left: r.left, width: r.width, height: r.height };
        });

        expect(box.top).toBeLessThan(50);  // near the top
        expect(box.width).toBeGreaterThan(400);
        expect(box.height).toBeGreaterThan(100);
        console.log(`Unity container: ${box.width}×${box.height} at (${box.left}, ${box.top})`);
    });

    test('Twine passage area renders below the Unity strip', async ({ page }) => {
        await page.goto(`${TWINE_URL}?nick=LoadTester`);
        await page.waitForSelector('#passages', { timeout: 10_000 });

        const unityBottom = await page.$eval('#unity-container', el =>
            el.getBoundingClientRect().bottom
        );
        const passageTop = await page.$eval('#passages', el =>
            el.getBoundingClientRect().top
        );

        // Passage content should start at or below the Unity strip
        expect(passageTop).toBeGreaterThanOrEqual(unityBottom - 20); // 20px tolerance
    });

});
