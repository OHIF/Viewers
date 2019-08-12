/**
 * Notice that we're not extracting CSS or generating a service-worker. This
 * may create a slightly inconsistent experience, but should allow for faster/
 * easier development.
 *
 * We do still need to generate the "index.html" and copy over files from
 * "public/" so our `webpack-dev-server` can _serve_ them for us :+1:
 */
const path = require('path');
const merge = require('webpack-merge');
const webpack = require('webpack');
const webpackCommon = require('./../../../.webpack/webpack.common.js');
// Plugins
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
// Const
const SRC_DIR = path.join(__dirname, '../src');
const DIST_DIR = path.join(__dirname, '../dist');
const PUBLIC_DIR = path.join(__dirname, '../public');

module.exports = (env, argv) => {
  const commonConfig = webpackCommon(env, argv, { SRC_DIR, DIST_DIR });

  return merge(commonConfig, {
    // https://webpack.js.org/configuration/mode/#mode-development
    mode: 'development',
    output: {
      path: DIST_DIR, // push to common?
      publicPath: '/',
      // filename: '[name].bundle.js',
    },
    plugins: [
      new webpack.HotModuleReplacementPlugin(),
      // Copy "Public" Folder to Dist
      new CopyWebpackPlugin([
        {
          from: PUBLIC_DIR,
          to: DIST_DIR,
          toType: 'dir',
          // Ignore our HtmlWebpackPlugin template file
          ignore: ['index.html', '.DS_Store'],
        },
      ]),
      // Generate "index.html" w/ correct includes/imports
      new HtmlWebpackPlugin({
        template: `${PUBLIC_DIR}/index.html`,
        filename: 'index.html',
        templateParameters: {
          PUBLIC_URL: '',
          REACT_APP_CONFIG: 'config/default.js',
        },
      }),
    ],
    // https://webpack.js.org/configuration/dev-server/
    devServer: {
      open: true,
      port: 3000,
      historyApiFallback: true,
    },
  });
};
