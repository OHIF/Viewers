const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ExtractCssChunks = require('extract-css-chunks-webpack-plugin');

//
const SRC_DIR = path.join(__dirname, '../src');
const PUBLIC_DIR = path.join(__dirname, '../public');
const DIST_DIR = path.join(__dirname, '../dist');

module.exports = (env, argv) => {
  return {
    entry: {
      app: `${SRC_DIR}/index.js`,
    },
    context: SRC_DIR,
    resolve: {
      modules: [
        // Modules specific to this package
        path.resolve(__dirname, '../node_modules'),
        // Hoisted Yarn Workspace Modules
        path.resolve(__dirname, '../../../node_modules'),
        SRC_DIR,
      ],
      extensions: ['.js', '.jsx', '.json', '*'],
      symlinks: true,
    },
    module: {
      rules: [
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
                },
              ],
            ],
          },
        },
        {
          test: /\.css$/,
          use: [
            'style-loader',
            ExtractCssChunks.loader,
            { loader: 'css-loader', options: { importLoaders: 1 } },
            {
              loader: 'postcss-loader',
              options: {
                config: {
                  path: './postcss.config.js',
                },
              },
            },
          ],
        },
        /**
         *
         */
        {
          test: /\.glsl$/i,
          include: /vtk\.js[\/\\]Sources/,
          loader: 'shader-loader',
        },
        /**
         *
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
      ],
    },
    plugins: [
      // "Public" Folder
      new CopyWebpackPlugin([
        {
          from: PUBLIC_DIR,
          to: DIST_DIR,
          toType: 'dir',
          // Ignore our HtmlWebpackPlugin template file
          ignore: ['index.html', '.DS_Store'],
        },
      ]),
      new webpack.EnvironmentPlugin(['NODE_ENV']),
      new ExtractCssChunks({
        filename: '[name].css',
        chunkFilename: '[id].css',
        // hot: true /* only necessary if hot reloading not function*/
      }),
      /**
       * This generates our index.html file from the specified template.
       * This is the easiest way to inject custom configuration and extensions.
       */
      new HtmlWebpackPlugin({
        template: `${PUBLIC_DIR}/index.html`,
        filename: 'index.html',
        templateParameters: {
          PUBLIC_URL: '',
          REACT_APP_CONFIG: 'config/default.js',
        },
        // favicon: `${PUBLIC_DIR}/favicon.ico`,
      }),
    ],
  };
};
