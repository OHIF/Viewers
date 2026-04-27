const base = require('../../jest.config.base.js');

module.exports = {
  ...base,
  moduleNameMapper: {
    ...base.moduleNameMapper,
    '@ohif/(.*)': '<rootDir>/../../platform/$1/src',
    // calculate-suv has dist/ not dist/esm/ - exclude from the general mapping
    '^@cornerstonejs/calculate-suv$': '<rootDir>/../../node_modules/@cornerstonejs/calculate-suv',
    '^@cornerstonejs/calculate-suv/(.*)$':
      '<rootDir>/../../node_modules/@cornerstonejs/calculate-suv/$1',
    '^@cornerstonejs/(.*)$': '<rootDir>/../../node_modules/@cornerstonejs/$1/dist/esm',
  },
  // rootDir: "../.."
  // testMatch: [
  //   //`<rootDir>/platform/${pack.name}/**/*.spec.js`
  //   "<rootDir>/platform/app/**/*.test.js"
  // ]
};
