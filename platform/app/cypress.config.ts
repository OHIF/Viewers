import { defineConfig } from 'cypress';

export default defineConfig({
  chromeWebSecurity: false,
  e2e: {
    experimentalRunAllSpecs: true,
    supportFile: 'cypress/support/index.js',
    setupNodeEvents(on, config) {
      on('before:browser:launch', (browser, launchOptions) => {
        console.log('***', browser.family, browser.name, '***');

        // Headless/no-GPU runs fall back to software WebGL, and newer Chromium
        // deprecated that implicit fallback (destabilizes canvas rendering).
        // Opt back in explicitly. Electron does NOT support launchOptions.args
        // (it warns and ignores them) — it gets this flag via the
        // ELECTRON_EXTRA_LAUNCH_ARGS env var (see .circleci/config.yml). So only
        // push it for real Chromium browsers (e.g. chrome) used locally.
        if (browser.family === 'chromium' && browser.name !== 'electron') {
          if (!launchOptions.args.includes('--enable-unsafe-swiftshader')) {
            launchOptions.args.push('--enable-unsafe-swiftshader');
          }
        }

        // whatever you return here becomes the launchOptions
        return launchOptions;
      });
    },
    baseUrl: 'http://localhost:3000',
    waitForAnimations: true,
    chromeWebSecurity: false,
    defaultCommandTimeout: 30000,
    requestTimeout: 30000,
    responseTimeout: 30000,
    pageLoadTimeout: 30000,
    specPattern: 'cypress/integration/**/*.spec.[jt]s',
    projectId: '4oe38f',
    video: true,
    reporter: 'junit',
    reporterOptions: {
      mochaFile: 'cypress/results/test-output.xml',
      toConsole: true,
    },
  },
});
