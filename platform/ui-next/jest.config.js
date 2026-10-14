const base = require('../../jest.config.base.js');
const pkg = require('./package');

module.exports = {
  ...base,
  displayName: pkg.name,

  // Override the base setting that transforms node_modules.
  transformIgnorePatterns: ['/node_modules/'],
};
