// ***********************************************************
// This example plugins/index.js can be used to load plugins
//
// You can change the location of this file or turn off loading
// the plugins file with the 'pluginsFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/plugins-guide
// ***********************************************************
let percyHealthCheck = require('@percy/cypress/task');

// This function is called when a project is opened or re-opened (e.g. due to
// the project's config changing)
module.exports = (on, config) => {
  // `on` is used to hook into various events Cypress emits
  // `config` is the resolved Cypress config
  on('before:browser:launch', (browser = {}, launchOptions) => {
    if (browser.name === 'chrome') {
      // `args` is an araay of all the arguments
      // that will be passed to Chrome when it launchers
      launchOptions.args.push('--start-fullscreen');

      // whatever you return here becomes the new args
      return launchOptions;
    }

    if (browser.name === 'chromium') {
      const newArgs = args.filter(arg => arg !== '--disable-gpu');
      newArgs.push('--ignore-gpu-blacklist');
      launchOptions.args = newArgs;

      return launchOptions;
    }
  });

  on('task', percyHealthCheck);
};
