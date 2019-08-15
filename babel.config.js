const aliases = require('./aliases.config');
const path = require('path');

module.exports = {
  // Also specified in .webpack/webpack.common.js
  // https://github.com/zloirock/core-js/blob/master/docs/2019-03-19-core-js-3-babel-and-a-look-into-the-future.md
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          ie: '11',
        },
        // https://babeljs.io/docs/en/babel-preset-env#usebuiltins
        useBuiltIns: 'usage',
        // https://babeljs.io/docs/en/babel-preset-env#corejs
        corejs: 3,
      },
    ],
    '@babel/preset-react',
  ],
  // https://babeljs.io/docs/en/options#babelrcroots
  babelrcRoots: ['./platform/*', './extensions/*'],
  plugins: [
    'react-hot-loader/babel',
    'inline-react-svg',
    '@babel/plugin-proposal-class-properties',
    '@babel/plugin-proposal-object-rest-spread',
    '@babel/plugin-syntax-dynamic-import',
    '@babel/plugin-transform-regenerator',
    '@babel/plugin-transform-runtime',
    [
      'module-resolver',
      {
        // https://github.com/tleunen/babel-plugin-module-resolver/issues/338
        // There seem to be a bug with module-resolver with a mono-repo setup:
        // It doesn't resolve paths correctly when using root/alias combo, so we
        // use this function instead.
        resolvePath(sourcePath, currentFile, opts) {
          // This will return undefined if aliases has no key for the sourcePath,
          // in which case module-resolver will fallback on its default behaviour.
          return aliases[sourcePath];
        },
      },
    ],
  ],
  env: {
    debug: {
      sourceMaps: 'inline',
      retainLines: true,
    },
    build: {
      ignore: ['**/*.test.jsx', '**/*.test.js', '__snapshots__', '__tests__'],
    },
  },
  // ignore: ["node_modules"]
};
