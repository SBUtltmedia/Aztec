import { defineConfig } from '@playwright/test';

// Server must be running before tests: `npm start`
const PORT = 53134;

export default defineConfig({
    testDir: './tests',
    outputDir: './test-results',

    // Each test file runs in parallel; tests within a file run sequentially
    fullyParallel: false,
    workers: 1, // Unity WebGL is resource-heavy; serialize to avoid interference

    reporter: [
        ['html', { outputFolder: 'playwright-report', open: 'never' }],
        ['list']
    ],

    use: {
        baseURL: `http://localhost:${PORT}`,
        // Capture screenshot + trace on every failure for post-mortem
        screenshot: 'only-on-failure',
        trace: 'on-first-retry',
        video: 'on-first-retry',
        // Unity WebGL is slow to compile WASM — be generous
        actionTimeout: 15_000,
        navigationTimeout: 60_000,
    },

    projects: [
        {
            name: 'chromium',
            use: {
                browserName: 'chromium',
                viewport: { width: 1280, height: 800 },
                // Allow SharedArrayBuffer (required for multi-threaded Unity builds)
                launchOptions: {
                    args: ['--enable-features=SharedArrayBuffer']
                }
            },
        },
        // Slow-motion project useful for live demos / debugging
        {
            name: 'demo',
            use: {
                browserName: 'chromium',
                viewport: { width: 1280, height: 800 },
                launchOptions: { slowMo: 800 },
                headless: false,
            },
            testMatch: '**/*.spec.js',
        },
    ],

    // Auto-start the server before tests run, reuse if already running.
    webServer: {
        command: 'npm start',
        url: `http://localhost:${PORT}`,
        timeout: 30_000,
        reuseExistingServer: true,
    },
});
