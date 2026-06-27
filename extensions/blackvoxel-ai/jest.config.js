const base = require('../../jest.config.base.js');

module.exports = {
  ...base,
  // base testMatch covers only .test.js / .test.ts; the AI-panel regression test
  // is a .test.tsx (JSX), so include tsx/jsx here too.
  testMatch: [
    '<rootDir>/src/**/*.test.js',
    '<rootDir>/src/**/*.test.jsx',
    '<rootDir>/src/**/*.test.ts',
    '<rootDir>/src/**/*.test.tsx',
  ],
  moduleNameMapper: {
    ...base.moduleNameMapper,
    '@ohif/(.*)': '<rootDir>/../../platform/$1/src',
  },
};
