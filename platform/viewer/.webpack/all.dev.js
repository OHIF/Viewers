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
const ASSET_PATH = process.env.ASSET_PATH || '/';
// Env Vars
const HTML_TEMPLATE = process.env.HTML_TEMPLATE || 'index.html';
const PUBLIC_URL = process.env.PUBLIC_URL || '';
const APP_CONFIG = process.env.APP_CONFIG || 'config/default.js';

module.exports = (env, argv) => {
  const commonConfig = webpackCommon(env, argv, { SRC_DIR, DIST_DIR });

  return merge(commonConfig, {
    // https://webpack.js.org/configuration/mode/#mode-development
    mode: 'development',
    output: {
      path: DIST_DIR, // push to common?
      publicPath: ASSET_PATH,
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
          // Ignore our configuration files
          ignore: ['config/*', 'html-templates/*', '.DS_Store'],
        },
        // Copy over and rename our target app config file
        {
          from: `${PUBLIC_DIR}/${APP_CONFIG}`,
          to: `${DIST_DIR}/app-config.js`,
        },
      ]),
      // Generate "index.html" w/ correct includes/imports
      new HtmlWebpackPlugin({
        template: `${PUBLIC_DIR}/html-templates/${HTML_TEMPLATE}`,
        filename: 'index.html',
        templateParameters: {
          PUBLIC_URL: PUBLIC_URL,
        },
      }),
    ],
    // https://webpack.js.org/configuration/dev-server/
    devServer: {
      hot: true,
      open: true,
      port: 3000,
      historyApiFallback: {
        disableDotRule: true,
      },
    },
  });
};
