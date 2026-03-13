import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },

  /* Run your local dev server before starting the tests */
  webServer: {
    command: `STORY=${process.env.STORY || 'demo'} npm start`,
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'demo',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          slowMo: 1000,
        }
      },
      timeout: 60 * 1000,
    },
    {
      // Run with: npx playwright test --project=aztec
      // Or a single role: npx playwright test --project=aztec --grep "Cortes"
      name: 'aztec',
      testMatch: '**/aztec-playthrough.spec.js',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:3000',
        // Slow enough to observe in headed mode; remove slowMo for CI
        launchOptions: { slowMo: 200 },
      },
      timeout: 5 * 60 * 1000, // 5 min per character max
    },
  ],
});
