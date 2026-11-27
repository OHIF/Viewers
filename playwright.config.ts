import { defineConfig, devices } from '@playwright/test';
import type { TestOptions } from './tests/utils/fixture';

export default defineConfig<TestOptions>({
  testDir: './tests',
  globalSetup: './tests/globalSetup.ts',
  fullyParallel: !!process.env.CI,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // TEMPORARY, revert before merge: no failure limit, so a run on the new viewports
  // reports every failure. Was `process.env.CI ? 10 : undefined`.
  maxFailures: undefined,
  workers: process.env.CI ? 18 : undefined,
  snapshotPathTemplate: './tests/screenshots{/projectName}/{testFilePath}/{arg}{ext}',
  outputDir: './tests/test-results',
  reporter: [['html', { outputFolder: './tests/playwright-report' }]],
  globalTimeout: 800_000,
  timeout: 800_000,
  use: {
    baseURL: 'http://localhost:3335',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    testIdAttribute: 'data-cy',
    actionTimeout: 10_000,
    launchOptions: {
      // do not hide the scrollbars so that we can assert their look-and-feel
      ignoreDefaultArgs: ['--hide-scrollbars'],
      args: ['--use-gl=egl'],
    },
  },

  projects: [
    {
      name: 'chromium',
      // TEMPORARY, revert before merge: `useNextViewports` runs the suite on the new
      // viewports only, against the existing screenshots.
      use: { ...devices['Desktop Chrome'], deviceScaleFactor: 1, useNextViewports: true },
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
    command:
      'cross-env APP_CONFIG=config/e2e.js COVERAGE=true OHIF_PORT=3335 OHIF_OPEN=false nyc pnpm --filter @ohif/app exec rsbuild dev --config ../../rsbuild.config.ts',
    url: 'http://localhost:3335',
    reuseExistingServer: !process.env.CI,
    timeout: 360_000,
  },
});
