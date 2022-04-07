// https://developers.google.com/web/tools/workbox/guides/codelabs/webpack
// ~~ WebPack
const path = require('path');
const merge = require('webpack-merge');
const webpack = require('webpack');
const webpackBase = require('./../../../.webpack/webpack.base.js');
// ~~ Plugins
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ExtractCssChunksPlugin = require('extract-css-chunks-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { InjectManifest } = require('workbox-webpack-plugin');
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
const PROXY_TARGET = process.env.PROXY_TARGET;
const PROXY_DOMAIN = process.env.PROXY_DOMAIN;
const ENTRY_TARGET = process.env.ENTRY_TARGET || `${SRC_DIR}/index.js`;

const setHeaders = (res, path) => {
  res.setHeader('Content-Type', 'text/plain');
  if (path.indexOf('.gz') !== -1) {
    res.setHeader('Content-Encoding', 'gzip');
  } else if (path.indexOf('.br') !== -1) {
    res.setHeader('Content-Encoding', 'br');
  }
};

module.exports = (env, argv) => {
  const baseConfig = webpackBase(env, argv, { SRC_DIR, DIST_DIR });
  const isProdBuild = process.env.NODE_ENV === 'production';
  const hasProxy = PROXY_TARGET && PROXY_DOMAIN;

  const mergedConfig = merge(baseConfig, {
    entry: {
      app: ENTRY_TARGET,
    },
    output: {
      path: DIST_DIR,
      filename: isProdBuild ? '[name].bundle.[chunkhash].js' : '[name].js',
      publicPath: PUBLIC_URL, // Used by HtmlWebPackPlugin for asset prefix
      devtoolModuleFilenameTemplate: function(info) {
        if (isProdBuild) {
          return `webpack:///${info.resourcePath}`;
        } else {
          return 'file:///' + encodeURI(info.absoluteResourcePath);
        }
      },
    },
    resolve: {
      // We use this alias and the CopyPlugin below to support using the dynamic-import version
      // of WADO Image Loader, but only when building a PWA. When we build a package, we must use the
      // bundled version of WADO Image Loader so we can produce a single file for the viewer.
      // (Note: script-tag version of the viewer will no longer be supported in OHIF v3)
      alias: {
        'cornerstone-wado-image-loader':
          'cornerstone-wado-image-loader/dist/dynamic-import/cornerstoneWADOImageLoader.min.js',
      },
    },
    module: {
      rules: [...extractStyleChunksRule(isProdBuild)],
    },
    plugins: [
      // Uncomment to generate bundle analyzer
      // new BundleAnalyzerPlugin(),
      // Clean output.path
      new CleanWebpackPlugin(),
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
        // Short term solution to make sure GCloud config is available in output
        // for our docker implementation
        {
          from: `${PUBLIC_DIR}/config/google.js`,
          to: `${DIST_DIR}/google.js`,
        },
        // Copy over and rename our target app config file
        {
          from: `${PUBLIC_DIR}/${APP_CONFIG}`,
          to: `${DIST_DIR}/app-config.js`,
        },
        {
          from:
            '../../../node_modules/cornerstone-wado-image-loader/dist/dynamic-import',
          to: DIST_DIR,
        },
      ]),
      // https://github.com/faceyspacey/extract-css-chunks-webpack-plugin#webpack-4-standalone-installation
      new ExtractCssChunksPlugin({
        filename: isProdBuild ? '[name].[hash].css' : '[name].css',
        chunkFilename: isProdBuild ? '[id].[hash].css' : '[id].css',
        ignoreOrder: false, // Enable to remove warnings about conflicting order
      }),
      // Generate "index.html" w/ correct includes/imports
      new HtmlWebpackPlugin({
        template: `${PUBLIC_DIR}/html-templates/${HTML_TEMPLATE}`,
        filename: 'index.html',
        templateParameters: {
          PUBLIC_URL: PUBLIC_URL,
        },
      }),
      // No longer maintained; but good for generating icons + manifest
      // new FaviconsWebpackPlugin( path.join(PUBLIC_DIR, 'assets', 'icons-512.png')),
      new InjectManifest({
        swDest: 'sw.js',
        swSrc: path.join(SRC_DIR, 'service-worker.js'),
        // Increase the limit to 4mb:
        // maximumFileSizeToCacheInBytes: 4 * 1024 * 1024
      }),
    ],
    optimization: {
      splitChunks: {
        // include all types of chunks
        chunks: 'all',
      },
      //runtimeChunk: 'single',
      minimize: isProdBuild,
      sideEffects: true,
    },
    // https://webpack.js.org/configuration/dev-server/
    devServer: {
      // gzip compression of everything served
      // Causes Cypress: `wait-on` issue in CI
      // compress: true,
      // http2: true,
      // https: true,
      hot: true,
      open: true,
      port: 3000,
      client: {
        overlay: { errors: true, warnings: false },
      },
      static: [
        {
          directory: path.join(require('os').homedir(), 'dicomweb'),
          staticOptions: {
            extensions: ['gz', 'br'],
            index: 'index.json.gz',
            redirect: true,
            setHeaders,
          },
          publicPath: '/dicomweb',
        },
        {
          directory: '../../testdata',
          staticOptions: {
            extensions: ['gz', 'br'],
            index: 'index.json.gz',
            redirect: true,
            setHeaders,
          },
          publicPath: '/testdata',
        },
      ],
      //public: 'http://localhost:' + 3000,
      //writeToDisk: true,
      historyApiFallback: {
        disableDotRule: true,
      },
      headers: {
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'Cross-Origin-Opener-Policy': 'same-origin',
      },
    },
  });

  if (hasProxy) {
    mergedConfig.devServer.proxy = {};
    mergedConfig.devServer.proxy[PROXY_TARGET] = PROXY_DOMAIN;
  }

  if (!isProdBuild) {
    mergedConfig.plugins.push(new webpack.HotModuleReplacementPlugin());
  }

  return mergedConfig;
};
