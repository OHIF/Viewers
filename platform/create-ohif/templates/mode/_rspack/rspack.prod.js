// Plugin Contract v1 build config. Do not edit output.library or externals —
// they ARE the contract the host loads this bundle against.
const path = require('path');
const rspack = require('@rspack/core');
const pkg = require('../package.json');

let externals;
try {
  // In-tree (modes/<name>/): prefer the monorepo canonical list.
  externals = require('../../../.rspack/pluginExternals.js');
} catch {
  externals = require('./pluginExternals.js');
}

const isProd = process.env.NODE_ENV === 'production';

module.exports = {
  mode: isProd ? 'production' : 'development',
  devtool: 'source-map',
  entry: path.resolve(__dirname, '../src/index.ts'),
  output: {
    path: path.resolve(__dirname, '../dist'),
    filename: 'index.umd.js',
    // UMD global = window[pkg.name]; export: 'default' makes that global the
    // mode object itself (no `.default` indirection).
    library: { name: pkg.name, type: 'umd', export: 'default' },
    globalObject: "typeof self !== 'undefined' ? self : this",
    clean: true,
  },
  externals,
  resolve: { extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'] },
  module: {
    rules: [
      {
        test: /\.[jt]sx?$/,
        exclude: /node_modules/,
        loader: 'builtin:swc-loader',
        options: {
          jsc: {
            parser: { syntax: 'typescript', tsx: true },
            transform: { react: { runtime: 'automatic' } },
          },
        },
      },
    ],
  },
  plugins: [new rspack.optimize.LimitChunkCountPlugin({ maxChunks: 1 })],
};
