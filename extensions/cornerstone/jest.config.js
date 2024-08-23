const base = require('../../jest.config.base.js');
const pkg = require('./package');

module.exports = {
  ...base,
  displayName: pkg.name,
  moduleNameMapper: {
    ...base.moduleNameMapper,
    '^@ohif/(.*)$': '<rootDir>/../../platform/$1/src',
    '^@cornerstonejs/tools(.*)$': '<rootDir>/../../node_modules/@cornerstonejs/tools',
  },
  // rootDir: "../.."
  // testMatch: [
  //   //`<rootDir>/platform/${pack.name}/**/*.spec.js`
  //   "<rootDir>/platform/app/**/*.test.js"
  // ]
};
