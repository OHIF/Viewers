const webpack = require('webpack');
const { merge } = require('webpack-merge');
const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const webpackCommon = require('./../../../.webpack/webpack.base.js');
const pkg = require('./../package.json');
const ROOT_DIR = path.join(__dirname, './..');
const SRC_DIR = path.join(__dirname, '../src');
const DIST_DIR = path.join(__dirname, '../dist');
const cssToJavaScript = require('../../../.webpack/rules/cssToJavaScript');

module.exports = (env, argv) => {
  const config = webpackCommon(env, argv, { SRC_DIR, DIST_DIR });

  config.plugins.push(
    new MiniCssExtractPlugin({
      filename: 'dist/[name].bundle.css',
      chunkFilename: 'dist/[id].css',
    })
  );

  config.module.rules.push(cssToJavaScript)
  return merge(config, {
    output: {
      path: ROOT_DIR,
      library: 'OHIFExtDefault',
      libraryTarget: 'umd',
      libraryExport: 'default',
      filename: pkg.main,
    },
    externals: {
      react: 'react',
      'react-router': 'react-router',
      'react-router-dom': 'react-router-dom',
    },
    plugins: [
      new webpack.optimize.LimitChunkCountPlugin({maxChunks: 1}),
    ],
  });
};
