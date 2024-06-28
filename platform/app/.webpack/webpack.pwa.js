// https://developers.google.com/web/tools/workbox/guides/codelabs/webpack
// ~~ WebPack
const path = require('path');
const { merge } = require('webpack-merge');
const webpack = require('webpack');
const webpackBase = require('./../../../.webpack/webpack.base.js');
// ~~ Plugins
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { InjectManifest } = require('workbox-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
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
const OHIF_PORT = Number(process.env.OHIF_PORT || 3000);
const ENTRY_TARGET = process.env.ENTRY_TARGET || `${SRC_DIR}/index.js`;
const Dotenv = require('dotenv-webpack');
const writePluginImportFile = require('./writePluginImportsFile.js');

const copyPluginFromExtensions = writePluginImportFile(SRC_DIR, DIST_DIR);

const setHeaders = (res, path) => {
  if (path.indexOf('.gz') !== -1) {
    res.setHeader('Content-Encoding', 'gzip');
  } else if (path.indexOf('.br') !== -1) {
    res.setHeader('Content-Encoding', 'br');
  }
  if (path.indexOf('.pdf') !== -1) {
    res.setHeader('Content-Type', 'application/pdf');
  } else if (path.indexOf('frames') !== -1) {
    res.setHeader('Content-Type', 'multipart/related');
  } else {
    res.setHeader('Content-Type', 'application/json');
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
      devtoolModuleFilenameTemplate: function (info) {
        if (isProdBuild) {
          return `webpack:///${info.resourcePath}`;
        } else {
          return 'file:///' + encodeURI(info.absoluteResourcePath);
        }
      },
    },
    resolve: {
      modules: [
        // Modules specific to this package
        path.resolve(__dirname, '../node_modules'),
        // Hoisted Yarn Workspace Modules
        path.resolve(__dirname, '../../../node_modules'),
        SRC_DIR,
      ],
    },
    plugins: [
      new Dotenv(),
      // Clean output.path
      new CleanWebpackPlugin(),
      // Copy "Public" Folder to Dist
      new CopyWebpackPlugin({
        patterns: [
          ...copyPluginFromExtensions,
          {
            from: PUBLIC_DIR,
            to: DIST_DIR,
            toType: 'dir',
            globOptions: {
              // Ignore our HtmlWebpackPlugin template file
              // Ignore our configuration files
              ignore: ['**/config/**', '**/html-templates/**', '.DS_Store'],
            },
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
          // Copy Dicom Microscopy Viewer build files
          {
            from: '../../../node_modules/dicom-microscopy-viewer/dist/dynamic-import',
            to: DIST_DIR,
            globOptions: {
              ignore: ['**/*.min.js.map'],
            },
            // The dicom-microscopy-viewer is optional, so if it doeesn't get
            // installed, it shouldn't cause issues.
            noErrorOnMissing: true,
          },
          // Copy dicom-image-loader build files
          {
            from: '../../../node_modules/@cornerstonejs/dicom-image-loader/dist/dynamic-import',
            to: DIST_DIR,
          },
        ],
      }),
      // Generate "index.html" w/ correct includes/imports
      new HtmlWebpackPlugin({
        template: `${PUBLIC_DIR}/html-templates/${HTML_TEMPLATE}`,
        filename: 'index.html',
        templateParameters: {
          PUBLIC_URL: PUBLIC_URL,
        },
      }),
      // Generate a service worker for fast local loads
      new InjectManifest({
        swDest: 'sw.js',
        swSrc: path.join(SRC_DIR, 'service-worker.js'),
        // Increase the limit to 4mb:
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        // Need to exclude the theme as it is updated independently
        exclude: [/theme/],
        // Cache large files for the manifests to avoid warning messages
        maximumFileSizeToCacheInBytes: 1024 * 1024 * 50,
      }),
    ],
    // https://webpack.js.org/configuration/dev-server/
    devServer: {
      // gzip compression of everything served
      // Causes Cypress: `wait-on` issue in CI
      // compress: true,
      // http2: true,
      // https: true,
      open: true,
      port: OHIF_PORT,
      client: {
        overlay: { errors: true, warnings: false },
      },
      proxy: {
        '/dicomweb': 'http://localhost:5000',
      },
      static: [
        {
          directory: '../../testdata',
          staticOptions: {
            extensions: ['gz', 'br', 'mht'],
            index: ['index.json.gz', 'index.mht.gz'],
            redirect: true,
            setHeaders,
          },
          publicPath: '/viewer-testdata',
        },
      ],
      //public: 'http://localhost:' + 3000,
      //writeToDisk: true,
      historyApiFallback: {
        disableDotRule: true,
        index: PUBLIC_URL + 'index.html',
      },
      headers: {
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'Cross-Origin-Opener-Policy': 'same-origin',
      },
    },
  });

  if (hasProxy) {
    mergedConfig.devServer.proxy = mergedConfig.devServer.proxy || {};
    mergedConfig.devServer.proxy[PROXY_TARGET] = PROXY_DOMAIN;
  }

  if (isProdBuild) {
    mergedConfig.plugins.push(
      new MiniCssExtractPlugin({
        filename: '[name].bundle.css',
        chunkFilename: '[id].css',
      })
    );
  }

  return mergedConfig;
};
