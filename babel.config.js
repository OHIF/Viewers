const aliases = require("./aliases.config");
const path = require("path");

module.exports = {
  // https://babeljs.io/docs/en/options#babelrcroots
  presets: [
    [
      "@babel/preset-env",
      {
        targets: {
          ie: "11"
        }
      }
    ],
    "@babel/preset-react"
  ],
  babelrcRoots: ["./platform/*", "./extensions/*"],
  plugins: [
    "inline-react-svg",
    "@babel/plugin-proposal-class-properties",
    "@babel/plugin-proposal-object-rest-spread",
    "@babel/plugin-syntax-dynamic-import",
    "@babel/plugin-transform-regenerator",
    "@babel/plugin-transform-runtime",
    [
      "module-resolver",
      {
        // https://github.com/tleunen/babel-plugin-module-resolver/issues/338
        // There seem to be a bug with module-resolver with a mono-repo setup:
        // It doesn't resolve paths correctly when using root/alias combo, so we
        // use this function instead.
        resolvePath(sourcePath, currentFile, opts) {
          // This will return undefined if aliases has no key for the sourcePath,
          // in which case module-resolver will fallback on its default behaviour.
          return aliases[sourcePath];
        }
      }
    ]
  ],
  env: {
    debug: {
      sourceMaps: "inline",
      retainLines: true
    },
    build: {
      ignore: ["**/*.test.jsx", "**/*.test.js", "__snapshots__", "__tests__"]
    }
  }
  // ignore: ["node_modules"]
};
