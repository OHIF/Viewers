const path = require('path');
const webpack = require('webpack');
const aliases = require('./../aliases.config');
const autoprefixer = require('autoprefixer');

module.exports = (env, argv, { SRC_DIR, DIST_DIR }) => {
  const mode =
    process.env.NODE_ENV === 'production' ? 'production' : 'development';

  return {
    mode,
    entry: {
      bundle: `${SRC_DIR}/index.js`,
    },
    context: SRC_DIR,
    module: {
      rules: [
        /**
         * This allows us to include web workers in our bundle, and VTK.js
         * web workers in our bundle. While this increases bundle size, it
         * cuts down on the number of includes we need for `script tag` usage.
         */
        {
          test: /\.worker\.js$/,
          include: /vtk\.js[\/\\]Sources/,
          use: [
            {
              loader: 'worker-loader',
              options: { inline: true, fallback: false },
            },
          ],
        },
        /**
         * This is exclusively used by `vtk.js` to bundle glsl files.
         */
        {
          test: /\.glsl$/i,
          include: /vtk\.js[\/\\]Sources/,
          loader: 'shader-loader',
        },
        /**
         * JSX
         */
        // https://github.com/babel/babel-loader/issues/293
        // https://github.com/babel/babel/issues/8309
        // https://www.google.com/search?client=firefox-b-1-d&ei=ToloXbSUMYrN-gTHjrj4Ag&q=babel-loader+imported+node_module+not+transpiled+monorepo&oq=babel-loader+imported+node_module+not+transpiled+monorepo&gs_l=psy-ab.3..33i160l4.298586.299699..299935...0.2..0.258.1637.0j7j2......0....1..gws-wiz.......0i71j33i22i29i30j33i299j33i10.P32jcbsfHCw&ved=0ahUKEwi085rJxankAhWKpp4KHUcHDi8Q4dUDCAo&uact=5
        {
          test: /\.jsx?$/,
          exclude: /node_modules/,
          loader: 'babel-loader',
          options: {
            // Find babel.config.js in monorepo root
            // https://babeljs.io/docs/en/options#rootmode
            rootMode: 'upward',
            envName: mode,
            presets: [
              [
                '@babel/preset-env',
                {
                  // Do not transform ES6 modules to another format.
                  // Webpack will take care of that.
                  modules: false,
                  targets: {
                    ie: '11',
                  },
                  shippedProposals: true,
                  // https://babeljs.io/docs/en/babel-preset-env#usebuiltins
                  useBuiltIns: 'usage',
                  // https://babeljs.io/docs/en/babel-preset-env#corejs
                  corejs: { version: 3, proposals: true },
                },
              ],
              '@babel/preset-react',
            ],
            plugins: [
              //'react-hot-loader/babel',
              'inline-react-svg',
              '@babel/plugin-proposal-class-properties',
              '@babel/plugin-transform-arrow-functions',
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
          },
        },
      ],
    },
    resolve: {
      // Which directories to search when resolving modules
      modules: [
        // Modules specific to this package
        path.resolve(__dirname, '../node_modules'),
        // Hoisted Yarn Workspace Modules
        path.resolve(__dirname, '../../../node_modules'),
        SRC_DIR,
      ],
      // Attempt to resolve these extensions in order.
      extensions: ['.js', '.jsx', '.json', '*'],
      // symlinked resources are resolved to their real path, not their symlinked location
      symlinks: true,
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
        'process.env.DEBUG': JSON.stringify(process.env.DEBUG),
        'process.env.APP_CONFIG': JSON.stringify(process.env.APP_CONFIG || ''),
        'process.env.PUBLIC_URL': JSON.stringify(process.env.PUBLIC_URL || '/'),
      }),
    ],
    // Fix: https://github.com/webpack-contrib/css-loader/issues/447#issuecomment-285598881
    // For issue in cornerstone-wado-image-loader
    node: {
      fs: 'empty',
    },
  };
};
