const path = require('path');
const webpack = require('webpack');
const autoprefixer = require('autoprefixer');
// const ExtractCssChunks = require('extract-css-chunks-webpack-plugin');

module.exports = (env, argv, { SRC_DIR, DIST_DIR }) => {
  return {
    entry: {
      bundle: `${SRC_DIR}/index.js`,
    },
    context: SRC_DIR,
    module: {
      rules: [
        /**
         * JSX
         */
        {
          test: /\.jsx?$/,
          exclude: [/node_modules/, /packages\\extension/],
          loader: 'babel-loader',
          options: {
            // Find babel.config.js in monorepo root
            // https://babeljs.io/docs/en/options#rootmode
            rootMode: 'upward',
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
                  // https://babeljs.io/docs/en/babel-preset-env#usebuiltins
                  useBuiltIns: 'usage',
                  // https://babeljs.io/docs/en/babel-preset-env#corejs
                  corejs: 3,
                },
              ],
            ],
          },
        },
        /**
         * Stylus to CSS
         * CSS to CommonJS
         * Style nodes from JS Strings
         */
        {
          test: /\.styl$/,
          use: [
            { loader: 'style-loader' },
            { loader: 'css-loader' },
            { loader: 'stylus-loader' },
          ],
        },
        {
          test: /\.css$/,
          use: [
            'style-loader',
            // ExtractCssChunks.loader,
            { loader: 'css-loader', options: { importLoaders: 1 } },
            {
              loader: 'postcss-loader',
              options: {
                config: {
                  path: './postcss.config.js',
                },
                plugins: () => [autoprefixer('last 2 version', 'ie >= 11')],
              },
            },
          ],
        },
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
        'process.env.PUBLIC_URL': JSON.stringify(process.env.PUBLIC_URL || ''),
      }),
    ],
    // Fix: https://github.com/webpack-contrib/css-loader/issues/447#issuecomment-285598881
    // For issue in cornerstone-wado-image-loader
    node: {
      fs: 'empty',
    },
  };
};
