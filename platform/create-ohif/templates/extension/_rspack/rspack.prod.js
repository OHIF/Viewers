// Plugin Contract v1 build config. Do not edit output.library or externals —
// they ARE the contract the host loads this bundle against.
const path = require('path');
const rspack = require('@rspack/core');
const pkg = require('../package.json');

let externals;
try {
  // In-tree (extensions/<name>/): prefer the monorepo canonical list.
  externals = require('../../../.rspack/pluginExternals.js');
} catch {
  externals = require('./pluginExternals.js');
}

const isProd = process.env.NODE_ENV === 'production';

module.exports = {
  mode: isProd ? 'production' : 'development',
  devtool: 'source-map',
  entry: path.resolve(__dirname, '../src/index.tsx'),
  output: {
    path: path.resolve(__dirname, '../dist'),
    filename: 'index.umd.js',
    // UMD global = window[pkg.name]; export: 'default' makes that global the
    // extension object itself (no `.default` indirection).
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
      {
        test: /\.css$/,
        // style-loader injects the compiled CSS as a <style> tag when this
        // bundle evaluates, so the styles load in every consumption mode:
        // bundled into the host build, loaded at runtime, or compiled from
        // source. Extracting to a separate index.css instead would leave the
        // stylesheet unloaded whenever the host bundles the prebuilt UMD.
        use: [
          'style-loader',
          { loader: 'css-loader', options: { importLoaders: 1 } },
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [require('tailwindcss')(path.resolve(__dirname, '../tailwind.config.js'))],
              },
            },
          },
        ],
      },
    ],
  },
  plugins: [new rspack.optimize.LimitChunkCountPlugin({ maxChunks: 1 })],
};
