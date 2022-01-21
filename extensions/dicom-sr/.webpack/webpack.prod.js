const webpack = require('webpack');
const { merge } = require('webpack-merge');
const path = require('path');
const webpackCommon = require('./../../../.webpack/webpack.base.js');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const SRC_DIR = path.join(__dirname, '../src');
const DIST_DIR = path.join(__dirname, '../dist');

const fileName = 'index.umd.js';
module.exports = (env, argv) => {
  const commonConfig = webpackCommon(env, argv, { SRC_DIR, DIST_DIR });

  return merge(commonConfig, {
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
      library: 'OHIFExtCornerstone',
      libraryTarget: 'umd',
      libraryExport: 'default',
      filename: fileName,
    },
    plugins: [
      new webpack.optimize.LimitChunkCountPlugin({
        maxChunks: 1,
      }),
      new MiniCssExtractPlugin({
        filename: '[name].css',
        chunkFilename: '[id].css',
      }),
    ],
  });
};
