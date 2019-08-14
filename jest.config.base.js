const path = require("path");

module.exports = {
  verbose: true,
  roots: ["<rootDir>/src"],
  transform: {
    "^.+\\.js$": "babel-jest"
  },
  testMatch: ["<rootDir>/src/**/*.test.js"],
  testPathIgnorePatterns: ["<rootDir>/node_modules/"],
  moduleFileExtensions: ["js", "jsx"],
  moduleNameMapper: {
    "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$":
      "<rootDir>/src/__mocks__/fileMock.js",
    "\\.(css|less)$": "identity-obj-proxy"
  },
  // Setup
  // setupFiles: ["jest-canvas-mock/lib/index.js"],
  // Coverage
  reporters: [
    "default",
    // Docs: https://www.npmjs.com/package/jest-junit
    [
      "jest-junit",
      {
        addFileAttribute: true // CircleCI Only
      }
    ]
  ],
  collectCoverage: false,
  collectCoverageFrom: [
    "<rootDir>/src/**/*.{js,jsx}",
    // Not
    "!<rootDir>/src/**/*.test.js",
    "!**/node_modules/**",
    "!**/__tests__/**",
    "!<rootDir>/dist/**"
  ]
};
