const base = require('../../jest.config.base.js');

module.exports = {
  ...base,
  moduleNameMapper: {
    ...base.moduleNameMapper,
    // Must precede the catch-all below, which would send this to a
    // `platform/extension-cornerstone` that does not exist.
    '^@ohif/extension-cornerstone$': '<rootDir>/src/__mocks__/ohifExtensionCornerstone.js',
    '@ohif/(.*)': '<rootDir>/../../platform/$1/src',
  },
};
