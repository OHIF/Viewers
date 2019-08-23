const path = require('path');
const merge = require('webpack-merge');
const webpack = require('webpack');
const webpackCommon = require('./../../../.webpack/webpack.common.js');
const HtmlWebpackPlugin = require('html-webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const SRC_DIR = path.join(__dirname, '../src');
const DIST_DIR = path.join(__dirname, '../dist');
const PUBLIC_DIR = path.join(__dirname, '../public');

module.exports = (env, argv) => {
  const commonConfig = webpackCommon(env, argv, { SRC_DIR, DIST_DIR });

  return merge(commonConfig, {
    // https://webpack.js.org/configuration/mode/#mode-production
    mode: 'production',
    entry: {
      bundle: `${SRC_DIR}/index-umd.js`,
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
      library: 'OHIFViewer',
      libraryTarget: 'umd',
      filename: 'index.umd.js',
    },
    /**
     * For CommonJS, we want to bundle whatever font we've landed on. This allows
     * us to reduce the number of script-tags we need to specify for simple use.
     *
     * PWA will grab these externally to reduce bundle size (think code split),
     * and cache the grab using service-worker.
     */
    module: {
      rules: [
        {
          test: /\.(ttf|eot|woff|woff2)$/i,
          use: [
            {
              loader: 'file-loader',
              options: {
                name: '[name].[ext]',
              },
            },
          ],
        },
      ],
    },
    plugins: [
      // Longer build. Let's report progress
      new webpack.ProgressPlugin(),
      // Clean output.path
      new CleanWebpackPlugin(),
      // "Public" Folder
      new CopyWebpackPlugin([
        {
          from: PUBLIC_DIR,
          to: DIST_DIR,
          toType: 'dir',
          // Ignore our HtmlWebpackPlugin template file
          ignore: ['index.html', '.DS_Store'],
        },
      ]),
      new HtmlWebpackPlugin({
        inject: false,
        template: '../cypress/support/script-tag/index.html'
      }),
    ],
  });
};
