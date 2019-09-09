const path = require('path');
const merge = require('webpack-merge');
const webpackCommon = require('./../../../.webpack/webpack.commonjs.js');
//
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const fontsToJavaScriptRule = require('./rules/fontsToJavaScript.js');
// const
const SRC_DIR = path.join(__dirname, '../src');
const DIST_DIR = path.join(__dirname, '../dist');

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
      library: 'ohifViewer',
      libraryTarget: 'umd',
      filename: 'index.umd.js',
    },
    module: {
      rules: [fontsToJavaScriptRule],
    },
    plugins: [
      // Clean output.path
      new CleanWebpackPlugin(),
    ],
  });
};
