const base = require('../../jest.config.base.js');

module.exports = {
  ...base,
  moduleNameMapper: {
    ...base.moduleNameMapper,
    '@ohif/(.*)': '<rootDir>/../../platform/$1/src',
  },
  // rootDir: "../.."
  // testMatch: [
  //   //`<rootDir>/platform/${pack.name}/**/*.spec.js`
  //   "<rootDir>/platform/app/**/*.test.js"
  // ]
};
