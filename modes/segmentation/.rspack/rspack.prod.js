const rspack = require('@rspack/core');
const { merge } = require('webpack-merge');
const path = require('path');

const pkg = require('./../package.json');
const rspackBase = require('./../../../.rspack/rspack.base.js');
const pluginExternals = require('./../../../.rspack/pluginExternals.js');

const ROOT_DIR = path.join(__dirname, './../');
const SRC_DIR = path.join(__dirname, '../src');
const DIST_DIR = path.join(__dirname, '../dist');
const ENTRY = { app: `${SRC_DIR}/index.tsx` };

module.exports = (env, argv) => {
  const commonConfig = rspackBase(env, argv, { SRC_DIR, DIST_DIR, ENTRY });
  return merge(commonConfig, {
    optimization: { minimize: true, sideEffects: false },
    output: {
      library: { name: 'ohif-mode-segmentation', type: 'umd', export: 'default' },
      path: ROOT_DIR,
      filename: pkg.main,
    },
    externals: pluginExternals,
    plugins: [new rspack.optimize.LimitChunkCountPlugin({ maxChunks: 1 })],
  });
};
