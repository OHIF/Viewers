// https://github.com/facebook/jest/issues/3613
// Yarn Doctor: `npx @yarnpkg/doctor .` -->
// '<rootDir>' warning:
// Strings should avoid referencing the node_modules directory (prefer require.resolve)

module.exports = {
  verbose: true,
  // roots: ['<rootDir>/src'],
  testMatch: ['<rootDir>/src/**/*.test.js', '<rootDir>/src/**/*.test.ts'],
  testPathIgnorePatterns: ['<rootDir>/node_modules/'],
  testEnvironment: 'jsdom',
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx'],
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest',
  },
  transformIgnorePatterns: [],
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/src/__mocks__/fileMock.js',
    '\\.(css|less)$': 'identity-obj-proxy',
  },
  // Setup
  // setupFiles: ["jest-canvas-mock/lib/index.js"],
  // Coverage
  reporters: [
    'default',
    // Docs: https://www.npmjs.com/package/jest-junit
    [
      'jest-junit',
      {
        addFileAttribute: true, // CircleCI Only
      },
    ],
  ],
  collectCoverage: false,
  collectCoverageFrom: [
    '<rootDir>/src/**/*.{js,jsx}',
    // Not
    '!<rootDir>/src/**/*.test.js',
    '!**/node_modules/**',
    '!**/__tests__/**',
    '!<rootDir>/dist/**',
  ],
};
