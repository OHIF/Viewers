const aliases = require('./aliases.config');
const path = require('path');

// https://babeljs.io/docs/en/options#babelrcroots
module.exports = {
  babelrcRoots: ['./platform/*', './extensions/*', './modes/*'],
  plugins: ['inline-react-svg', '@babel/plugin-proposal-class-properties'],
  env: {
    test: {
      presets: [
        [
          // TODO: https://babeljs.io/blog/2019/03/19/7.4.0#migration-from-core-js-2
          '@babel/preset-env',
          {
            modules: 'commonjs',
            debug: false,
          },
        ],
        '@babel/preset-react',
      ],
      plugins: [
        '@babel/plugin-proposal-object-rest-spread',
        '@babel/plugin-syntax-dynamic-import',
        '@babel/plugin-transform-regenerator',
        '@babel/plugin-transform-runtime',
      ],
    },
    production: {
      presets: [
        // WebPack handles ES6 --> Target Syntax
        ['@babel/preset-env', { modules: false }],
        '@babel/preset-react',
      ],
      ignore: ['**/*.test.jsx', '**/*.test.js', '__snapshots__', '__tests__'],
    },
    development: {
      presets: [
        // WebPack handles ES6 --> Target Syntax
        ['@babel/preset-env', { modules: false }],
        '@babel/preset-react',
      ],
      plugins: ['react-hot-loader/babel'],
      ignore: ['**/*.test.jsx', '**/*.test.js', '__snapshots__', '__tests__'],
    },
  },
};

// TODO: Plugins; Aliases
// We don't currently use aliases, but this is a nice snippet that would help
// [
//   'module-resolver',
//   {
//     // https://github.com/tleunen/babel-plugin-module-resolver/issues/338
//     // There seem to be a bug with module-resolver with a mono-repo setup:
//     // It doesn't resolve paths correctly when using root/alias combo, so we
//     // use this function instead.
//     resolvePath(sourcePath, currentFile, opts) {
//       // This will return undefined if aliases has no key for the sourcePath,
//       // in which case module-resolver will fallback on its default behaviour.
//       return aliases[sourcePath];
//     },
//   },
// ],
