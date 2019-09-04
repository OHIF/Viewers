/**
 * Notice that we're not extracting CSS or generating a service-worker. This
 * may create a slightly inconsistent experience, but should allow for faster/
 * easier development.
 *
 * We do still need to generate the "index.html" and copy over files from
 * "public/" so our `webpack-dev-server` can _serve_ them for us :+1:
 */
// ~~ WebPack
const path = require('path');
const merge = require('webpack-merge');
const webpack = require('webpack');
const webpackBase = require('./../../../.webpack/webpack.base.js');
// ~~ Plugins
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer')
  .BundleAnalyzerPlugin;
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ExtractCssChunksPlugin = require('extract-css-chunks-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const WorkboxPlugin = require('workbox-webpack-plugin');
const TerserJSPlugin = require('terser-webpack-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
// ~~ Rules
const extractStyleChunksRule = require('./rules/extractStyleChunks.js');
// ~~ Directories
const SRC_DIR = path.join(__dirname, '../src');
const DIST_DIR = path.join(__dirname, '../dist');
const PUBLIC_DIR = path.join(__dirname, '../public');
// ~~ Env Vars
const HTML_TEMPLATE = process.env.HTML_TEMPLATE || 'index.html';
const PUBLIC_URL = process.env.PUBLIC_URL || '/';
const APP_CONFIG = process.env.APP_CONFIG || 'config/default.js';

module.exports = (env, argv) => {
  const baseConfig = webpackBase(env, argv, { SRC_DIR, DIST_DIR });

  const mode =
    process.env.NODE_ENV === 'production' ? 'production' : 'development';
  const hmrPlugin =
    mode === 'development' ? new webpack.HotModuleReplacementPlugin() : [];

  return merge(baseConfig, {
    devtool: mode === 'production' ? 'source-map' : false,
    output: {
      path: DIST_DIR,
      filename: '[name].bundle.[chunkhash].js',
      publicPath: PUBLIC_URL, // Used by HtmlWebPackPlugin for asset prefix
    },
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
      minimize: false,
      sideEffects: true,
      //   // TODO: For more granular minimize
      //   // minimizer: [
      //   //   new TerserJSPlugin({
      //   //     sourceMap: true,
      //   //     terserOptions: {
      //   //       sourceMap: {
      //   //         file: '[name].map',
      //   //         url: 'https://my-host/[url]',
      //   //       },
      //   //     },
      //   //   }),
      //   //   new OptimizeCSSAssetsPlugin({}),
      //   // ],
    },
    module: {
      rules: [...extractStyleChunksRule(mode)],
    },
    plugins: [
      // Uncomment to generate bundle analyzer
      // new BundleAnalyzerPlugin(),
      // Clean output.path
      new CleanWebpackPlugin(),
      hmrPlugin,
      // Copy "Public" Folder to Dist
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
      // Generate "index.html" w/ correct includes/imports
      new HtmlWebpackPlugin({
        template: `${PUBLIC_DIR}/html-templates/${HTML_TEMPLATE}`,
        filename: 'index.html',
        templateParameters: {
          PUBLIC_URL: PUBLIC_URL,
        },
        // favicon: `${PUBLIC_DIR}/favicon.ico`,
      }),
      new WorkboxPlugin.GenerateSW({
        swDest: 'sw.js',
        clientsClaim: true,
        skipWaiting: true,
      }),
    ],
    // https://webpack.js.org/configuration/dev-server/
    devServer: {
      hot: true,
      open: true,
      port: 3000,
      historyApiFallback: {
        disableDotRule: true,
      },
    },
  });
};
