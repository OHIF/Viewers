import { defineConfig } from 'cypress';

export default defineConfig({
  chromeWebSecurity: false,
  e2e: {
    experimentalRunAllSpecs: true,
    supportFile: 'cypress/support/index.js',
    setupNodeEvents(on, config) {
      on('before:browser:launch', (browser, launchOptions) => {
        // `args` is an array of all the arguments that will
        // be passed to browsers when it launches

        console.log(launchOptions.args); // print all current args

        console.log('***', browser.family, browser.name, '***');
        if (browser.family === 'chromium' && browser.name !== 'electron') {
          // auto open devtools
          launchOptions.args.push('--enable-features=SharedArrayBuffer');
        }

        // whatever you return here becomes the launchOptions
        return launchOptions;
      });
    },
    baseUrl: 'http://localhost:3000',
    waitForAnimations: true,
    chromeWebSecurity: false,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
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
