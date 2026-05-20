import { defineConfig, devices } from '@playwright/test';

const E2E_PORT = Number(process.env.OHIF_PORT || 3335);
const E2E_BASE_URL = `http://localhost:${E2E_PORT}`;

export default defineConfig({
  globalSetup: './tests/global-setup.ts',
  testDir: './tests',
  fullyParallel: !!process.env.CI,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  maxFailures: process.env.CI ? 10 : undefined,
  workers: process.env.CI ? 6 : undefined,
  snapshotPathTemplate: './tests/screenshots{/projectName}/{testFilePath}/{arg}{ext}',
  outputDir: './tests/test-results',
  reporter: [
    ['html', { outputFolder: './tests/playwright-report' }],
  ],
  globalTimeout: 800_000,
  timeout: 800_000,
  use: {
    baseURL: E2E_BASE_URL,
    trace: 'on-first-retry',
    video: 'on-first-retry',
    testIdAttribute: 'data-cy',
    actionTimeout: 10_000,
    launchOptions: {
      // do not hide the scrollbars so that we can assert their look-and-feel
      ignoreDefaultArgs: ['--hide-scrollbars'],
    },
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
    command: `cross-env APP_CONFIG=config/e2e.js COVERAGE=true OHIF_PORT=${E2E_PORT} nyc yarn start`,
    url: E2E_BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 360_000,
  },
});
