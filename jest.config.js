module.exports = {
  verbose: true,
  testMatch: ['<rootDir>/src/**/*.test.js'],
  //
  collectCoverage: false,
  collectCoverageFrom: [
    '<rootDir>/src/**/*.{js,jsx}',
    '!<rootDir>/src/**/*.test.js',
    '!**/node_modules/**',
    '!**/__tests__/**',
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
