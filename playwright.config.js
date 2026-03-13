import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: `http://localhost:${process.env.PORT || 53134}`,
    trace: 'on-first-retry',
  },

  /* Start a dev server if one isn't already running */
  webServer: {
    command: `STORY=${process.env.STORY || 'aztec'} npm start`,
    url: `http://localhost:${process.env.PORT || 53134}`,
    reuseExistingServer: true,   // always reuse — don't fight the running dev server
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
        launchOptions: { slowMo: 1000 },
      },
      timeout: 60 * 1000,
    },
    {
      // Run with: npm run test:aztec
      // Single role: AZTEC_ROLE=Cortes npm run test:aztec:one Cortes
      name: 'aztec',
      testMatch: '**/aztec-playthrough.spec.js',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: { slowMo: 100 },
      },
      // Each individual character test gets 15 min; the full-suite test gets
      // 30 min (15 characters × ~2 min each worst case).
      timeout: 30 * 60 * 1000,
    },
  ],
});
