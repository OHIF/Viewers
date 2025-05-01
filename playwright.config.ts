import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: !!process.env.CI,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  snapshotPathTemplate: './tests/screenshots{/projectName}/{testFilePath}/{arg}{ext}',
  outputDir: './tests/test-results',
  reporter: [[process.env.CI ? 'blob' : 'html', { outputFolder: './tests/playwright-report' }]],
  globalTimeout: 800_000,
  timeout: 800_000,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    video: 'on',
    testIdAttribute: 'data-cy',
    actionTimeout: 10_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], deviceScaleFactor: 1 },
    },
    // TODO: Fix firefox tests
    // {
    //  name: 'firefox',
    //  use: { ...devices['Desktop Firefox'], deviceScaleFactor: 1 },
    // },
    // This is commented out until SharedArrayBuffer is enabled in WebKit
    // See: https://github.com/microsoft/playwright/issues/14043

    //{
    //  name: 'webkit',
    //  use: { ...devices['Desktop Safari'], deviceScaleFactor: 1 },
    //},
  ],
  webServer: {
    command: 'cross-env APP_CONFIG=config/e2e.js yarn start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 360_000,
  },
});
