const babelJest = require("babel-jest");

module.exports = babelJest.createTransformer({
  rootMode: "upward"
});
