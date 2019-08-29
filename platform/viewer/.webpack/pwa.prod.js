const path = require('path');
const merge = require('webpack-merge');
const webpack = require('webpack');
const webpackCommon = require('./../../../.webpack/webpack.common-pwa.js');
// Plugins
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ExtractCssChunksPlugin = require('extract-css-chunks-webpack-plugin');
const TerserJSPlugin = require('terser-webpack-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const workboxPlugin = require('workbox-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer')
  .BundleAnalyzerPlugin;
//
const SRC_DIR = path.join(__dirname, '../src');
const DIST_DIR = path.join(__dirname, '../dist');
const PUBLIC_DIR = path.join(__dirname, '../public');
// Env Vars
const HTML_TEMPLATE = process.env.HTML_TEMPLATE || 'index.html';
const PUBLIC_URL = process.env.PUBLIC_URL || '/';
const APP_CONFIG = process.env.APP_CONFIG || 'config/default.js';

module.exports = (env, argv) => {
  const commonConfig = webpackCommon(env, argv, { SRC_DIR, DIST_DIR });

  return merge(commonConfig, {
    // https://webpack.js.org/configuration/mode/#mode-production
    mode: 'production',
    // Out of memory -- Code Split
    // devtool: 'source-map',
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
      minimizer: [new TerserJSPlugin({}), new OptimizeCSSAssetsPlugin({})],
    },
    output: {
      path: DIST_DIR,
      filename: '[name].bundle.[chunkhash].js',
      publicPath: PUBLIC_URL, // Used by HtmlWebPackPlugin for asset prefix
    },
    module: {
      rules: [
        {
          test: /\.styl$/,
          use: [
            {
              loader: ExtractCssChunksPlugin.loader,
              options: {
                hot: process.env.NODE_ENV === 'development',
              },
            },
            { loader: 'css-loader' },
            { loader: 'stylus-loader' },
          ],
        },
        {
          test: /\.(sa|sc|c)ss$/,
          use: [
            {
              loader: ExtractCssChunksPlugin.loader,
              options: {
                hot: process.env.NODE_ENV === 'development',
              },
            },
            'css-loader',
            'postcss-loader',
            // 'sass-loader',
          ],
        },
      ],
    },
    module: {
      rules: [
        {
          test: /\.styl$/,
          use: [
            {
              loader: ExtractCssChunksPlugin.loader,
              options: {
                hot: process.env.NODE_ENV === 'development',
              },
            },
            { loader: 'css-loader' },
            { loader: 'stylus-loader' },
          ],
        },
        {
          test: /\.(sa|sc|c)ss$/,
          use: [
            {
              loader: ExtractCssChunksPlugin.loader,
              options: {
                hot: process.env.NODE_ENV === 'development',
              },
            },
            'css-loader',
            'postcss-loader',
            // 'sass-loader',
          ],
        },
      ],
    },
    // TODO:
    // Do we need to rip anything out of the more generic common.js we're
    // merging with this?
    plugins: [
      // Uncomment to generate bundle analyzer
      // new BundleAnalyzerPlugin(),
      // Clean output.path
      new CleanWebpackPlugin(),
      // "Public" Folder
      new CopyWebpackPlugin([
        {
          from: PUBLIC_DIR,
          to: DIST_DIR,
          toType: 'dir',
          // Ignore our HtmlWebpackPlugin template file
          // Ignore our configuration files
          ignore: ['config/*', 'html-templates/*', '.DS_Store'],
        },
        // Copy over and rename our target app config file
        {
          from: `${PUBLIC_DIR}/${APP_CONFIG}`,
          to: `${DIST_DIR}/app-config.js`,
        },
      ]),
      // https://github.com/faceyspacey/extract-css-chunks-webpack-plugin#webpack-4-standalone-installation
      new ExtractCssChunksPlugin({
        filename: '[name].css',
        chunkFilename: '[id].css',
        ignoreOrder: false, // Enable to remove warnings about conflicting order
      }),
      /**
       * This generates our index.html file from the specified template.
       * This is the easiest way to inject custom configuration and extensions.
       */
      new HtmlWebpackPlugin({
        template: `${PUBLIC_DIR}/html-templates/${HTML_TEMPLATE}`,
        filename: 'index.html',
        templateParameters: {
          PUBLIC_URL: PUBLIC_URL,
        },
        // favicon: `${PUBLIC_DIR}/favicon.ico`,
      }),
      new workboxPlugin.GenerateSW({
        swDest: 'sw.js',
        clientsClaim: true,
        skipWaiting: true,
      }),
    ],
  });
};
