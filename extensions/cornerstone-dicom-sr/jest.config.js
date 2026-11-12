const base = require('../../jest.config.base.js');

module.exports = {
  ...base,
  moduleNameMapper: {
    ...base.moduleNameMapper,
    // Must precede the catch-all below, which would send this to a
    // `platform/extension-cornerstone` that does not exist.
    '^@ohif/extension-cornerstone$': '<rootDir>/src/__mocks__/ohifExtensionCornerstone.js',
    // Deep imports already name `src`, so they must be matched before the
    // catch-all below appends a second one (e.g. `@ohif/core/src/utils/x`
    // would otherwise resolve to `platform/core/src/utils/x/src`).
    '^@ohif/([^/]+)/src/(.*)$': '<rootDir>/../../platform/$1/src/$2',
    '@ohif/(.*)': '<rootDir>/../../platform/$1/src',
  },
};
