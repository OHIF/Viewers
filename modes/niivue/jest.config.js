const path = require('path');
const base = require('../../jest.config.base.js');

module.exports = {
  ...base,
  // The mode's own babel.config.js is for its UMD build; tests share the root
  // config like the extensions do.
  transform: {
    '^.+\\.[jt]sx?$': [
      'babel-jest',
      { configFile: path.resolve(__dirname, '../../babel.config.js') },
    ],
  },
};
