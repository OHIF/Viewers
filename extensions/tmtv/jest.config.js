const base = require('../../jest.config.base.js');

module.exports = {
  ...base,
  moduleNameMapper: {
    ...base.moduleNameMapper,
    // Extension packages live under extensions/, so this must be matched before the
    // generic @ohif/* rule below, which resolves into platform/.
    '^@ohif/extension-(.*)$': '<rootDir>/../../extensions/$1/src',
    '@ohif/(.*)': '<rootDir>/../../platform/$1/src',
  },
};
