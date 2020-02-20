const webpack = require('webpack');
const merge = require('webpack-merge');
const path = require('path');
const webpackCommon = require('./../../../.webpack/webpack.commonjs.js');
const pkg = require('./../package.json');

const ROOT_DIR = path.join(__dirname, './..');
const SRC_DIR = path.join(__dirname, '../src');
const DIST_DIR = path.join(__dirname, '../dist');

module.exports = (env, argv) => {
  const commonConfig = webpackCommon(env, argv, { SRC_DIR, DIST_DIR });

  return merge(commonConfig, {
    devtool: 'source-map',
    optimization: {
      minimize: true,
      sideEffects: true,
    },
    output: {
      path: ROOT_DIR,
      library: 'OHIFExtDicomSeg',
      libraryTarget: 'umd',
      libraryExport: 'default',
      filename: pkg.main,
    },
    plugins: [
      new webpack.optimize.LimitChunkCountPlugin({
        maxChunks: 1,
      }),
    ],
  });
};
