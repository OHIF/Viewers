// Initiate all tests from root, but allow tests from each package root.
// Share as much config as possible to reduce duplication.
//
// Borrowing from here:
// https://github.com/facebook/jest/issues/3112#issuecomment-398581705
const base = require("./jest.config.base.js");

module.exports = {
  ...base,
  // https://jestjs.io/docs/en/configuration#projects-array-string-projectconfig
  projects: [
    // "<rootDir>/extensions/*/jest.config.js",
    "<rootDir>/platform/*/jest.config.js",
    "<rootDir>/extensions/*/jest.config.js"
  ],
  coverageDirectory: "<rootDir>/coverage/"
};
