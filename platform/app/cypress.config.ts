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
