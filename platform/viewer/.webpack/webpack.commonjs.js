// ~~ WebPack
const webpack = require('webpack');
const path = require('path');
const merge = require('webpack-merge');
const webpackCommon = require('./../../../.webpack/webpack.commonjs.js');
// ~~ Plugins
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const fontsToJavaScriptRule = require('./rules/fontsToJavaScript.js');
const HtmlWebpackPlugin = require('html-webpack-plugin');
// const
const SRC_DIR = path.join(__dirname, '../src');
const DIST_DIR = path.join(__dirname, '../dist');
const PUBLIC_DIR = path.join(__dirname, '../public');
// ~~ Env Vars
const APP_CONFIG = process.env.APP_CONFIG || 'config/default.js';
const HTML_TEMPLATE = process.env.HTML_TEMPLATE || 'script-tag.html';
const PUBLIC_URL = process.env.PUBLIC_URL || '/';

module.exports = (env, argv) => {
  const commonConfig = webpackCommon(env, argv, { SRC_DIR, DIST_DIR });

  const mergedConfig = merge(commonConfig, {
    entry: {
      app: `${SRC_DIR}/index-umd.js`,
    },
    output: {
      path: DIST_DIR,
      library: 'OHIFViewer',
      libraryTarget: 'umd',
      filename: 'index.umd.js',
    },
    module: {
      rules: [fontsToJavaScriptRule],
    },
    plugins: [
      // Clean output.path
      new CleanWebpackPlugin(),
      new CopyWebpackPlugin([
        // Copy over and rename our target app config file
        {
          from: `${PUBLIC_DIR}/${APP_CONFIG}`,
          to: `${DIST_DIR}/app-config.js`,
        },
      ]),
      // Generate "index.html" w/ correct includes/imports
      // NOTE: We use this for E2E Tests
      new HtmlWebpackPlugin({
        inject: false,
        template: `${PUBLIC_DIR}/html-templates/${HTML_TEMPLATE}`,
        filename: 'index.html',
        templateParameters: {
          PUBLIC_URL: PUBLIC_URL,
        },
      }),
      new webpack.optimize.LimitChunkCountPlugin({
        maxChunks: 1,
      }),
    ],
  });

  return mergedConfig;
};
