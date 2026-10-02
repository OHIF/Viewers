const webpack = require('@rspack/core');
const { merge } = require('webpack-merge');
const path = require('path');
const MiniCssExtractPlugin = webpack.CssExtractRspackPlugin;

const pkg = require('./../package.json');
const webpackCommon = require('./../../../.rspack/rspack.base.js');
const pluginExternals = require('./../../../.rspack/pluginExternals.js');

const ROOT_DIR = path.join(__dirname, './../');
const SRC_DIR = path.join(__dirname, '../src');
const DIST_DIR = path.join(__dirname, '../dist');
const ENTRY = {
  app: `${SRC_DIR}/index.tsx`,
};

module.exports = (env, argv) => {
  const commonConfig = webpackCommon(env, argv, { SRC_DIR, DIST_DIR, ENTRY });

  return merge(commonConfig, {
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
      sideEffects: false,
    },
    output: {
      library: {
        name: 'ohif-mode-preclinical-4d',
        type: 'umd',
        export: 'default',
      },
      path: ROOT_DIR,
      filename: pkg.main,
    },
    externals: pluginExternals,
    plugins: [
      new webpack.optimize.LimitChunkCountPlugin({
        maxChunks: 1,
      }),
      // new MiniCssExtractPlugin({
      //   filename: './dist/[name].css',
      //   chunkFilename: './dist/[id].css',
      // }),
    ],
  });
};
