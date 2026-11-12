const base = require('../../jest.config.base.js');

module.exports = {
  ...base,
  moduleNameMapper: {
    ...base.moduleNameMapper,
    // Must precede the catch-all below, which would send these to a
    // `platform/extension-*` that does not exist.
    '^@ohif/extension-(default|cornerstone)$': '<rootDir>/src/__mocks__/ohifExtensionStub.js',
    // Deep imports already name `src`, so they must be matched before the
    // catch-all below appends a second one.
    '^@ohif/([^/]+)/src/(.*)$': '<rootDir>/../../platform/$1/src/$2',
    '^@ohif/([^/]+)$': '<rootDir>/../../platform/$1/src',
  },
};
