const webpack = require('webpack');
const path = require('path');
const merge = require('webpack-merge');
const webpackCommon = require('./../../../.webpack/webpack.commonjs.js');
//
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const fontsToJavaScriptRule = require('./rules/fontsToJavaScript.js');
const HtmlWebpackPlugin = require('html-webpack-plugin');
// const
const SRC_DIR = path.join(__dirname, '../src');
const DIST_DIR = path.join(__dirname, '../dist');
const PUBLIC_DIR = path.join(__dirname, '../public');
// ~~ Env Vars
const HTML_TEMPLATE = process.env.HTML_TEMPLATE || 'script-tag.html';
const PUBLIC_URL = process.env.PUBLIC_URL || '/';

module.exports = (env, argv) => {
  const commonConfig = webpackCommon(env, argv, { SRC_DIR, DIST_DIR });

  return merge(commonConfig, {
    entry: {
      app: `${SRC_DIR}/index-umd.js`,
    },
    devtool: 'source-map',
    stats: {
      colors: true,
      hash: true,
      timings: true,
      assets: true,
      chunks: false,
      chunkModules: false,
      modules: false,
      children: false,
      warnings: true,
    },
    optimization: {
      minimize: true,
      sideEffects: true,
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
      // Generate "index.html" w/ correct includes/imports
      new HtmlWebpackPlugin({
        inject: false,
        template: `${PUBLIC_DIR}/html-templates/${HTML_TEMPLATE}`,
        filename: 'index.html',
      }),
      new webpack.optimize.LimitChunkCountPlugin({
           maxChunks: 1
       })
    ],
  });
};
