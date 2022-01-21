const { merge } = require('webpack-merge');
const path = require('path');
const webpackCommon = require('./../../../.webpack/webpack.base.js');

const SRC_DIR = path.join(__dirname, '../src');
const DIST_DIR = path.join(__dirname, '../dist');

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
      library: 'ohifCore',
      libraryTarget: 'umd',
      filename: '[name].[chunkhash].js',
      chunkFilename: '[id].[chunkhash].js',
    },
    externals: [
      {
        'cornerstone-math': {
          commonjs: 'cornerstone-math',
          commonjs2: 'cornerstone-math',
          amd: 'cornerstone-math',
          root: 'cornerstoneMath',
        },
      },
    ],
  });
};
