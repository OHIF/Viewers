const rspack = require('@rspack/core');
const { merge } = require('webpack-merge');
const path = require('path');
const rspackBase = require('./../../../.rspack/rspack.base.js');
const pluginExternals = require('./../../../.rspack/pluginExternals.js');
const pkg = require('./../package.json');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const ROOT_DIR = path.join(__dirname, './..');
const SRC_DIR = path.join(__dirname, '../src');
const DIST_DIR = path.join(__dirname, '../dist');
const ENTRY = {
  app: `${SRC_DIR}/index.tsx`,
};

module.exports = (env, argv) => {
  const commonConfig = rspackBase(env, argv, { SRC_DIR, ENTRY, DIST_DIR });

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
        name: 'ohif-extension-cornerstone-dicom-rt',
        type: 'umd',
      },
      path: ROOT_DIR,
      filename: pkg.main,
    },
    externals: pluginExternals,
    plugins: [
      new rspack.optimize.LimitChunkCountPlugin({
        maxChunks: 1,
      }),
      // new BundleAnalyzerPlugin(),
    ],
  });
};
