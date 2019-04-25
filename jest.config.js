module.exports = {
  verbose: true,
  testPathIgnorePatterns: ['<rootDir>/node_modules/'],
  testMatch: ['<rootDir>/src/**/*.test.js'],
  //
  collectCoverage: false,
  collectCoverageFrom: [
    '**/*.{js,jsx}',
    '!**/node_modules/**',
    '!<rootDir>/dist/**',
  ],
  reporters: ['default', 'jest-junit'],
  //
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/src/__mocks__/fileMock.js',
    '\\.(css|less)$': 'identity-obj-proxy',
  },
  setupFiles: ['<rootDir>/node_modules/jest-canvas-mock/lib/index.js'],
  setupTestFrameworkScriptFile: '<rootDir>/src/__tests__/globalSetup.js',
}
