// ~~ ENV
const dotenv = require('dotenv');
//
const path = require('path');
const webpack = require('webpack');

// ~~ PLUGINS
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer')
  .BundleAnalyzerPlugin;
const TerserJSPlugin = require('terser-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

// ~~ PackageJSON
const PACKAGE = require('../platform/viewer/package.json');
// const vtkRules = require('vtk.js/Utilities/config/dependency.js').webpack.core
//   .rules;
// ~~ RULES
const loadShadersRule = require('./rules/loadShaders.js');
const loadWebWorkersRule = require('./rules/loadWebWorkers.js');
const transpileJavaScriptRule = require('./rules/transpileJavaScript.js');
const cssToJavaScript = require('./rules/cssToJavaScript.js');

// ~~ ENV VARS
const NODE_ENV = process.env.NODE_ENV;
const QUICK_BUILD = process.env.QUICK_BUILD;
const BUILD_NUM = process.env.CIRCLE_BUILD_NUM || '0';

//
dotenv.config();

module.exports = (env, argv, { SRC_DIR, DIST_DIR }) => {
  if (!process.env.NODE_ENV) {
    throw new Error('process.env.NODE_ENV not set');
  }

  const mode = NODE_ENV === 'production' ? 'production' : 'development';
  const isProdBuild = NODE_ENV === 'production';
  const isQuickBuild = QUICK_BUILD === 'true';

  const config = {
    mode: isProdBuild ? 'production' : 'development',
    devtool: isProdBuild ? 'source-map' : 'cheap-module-source-map',
    entry: {
      app: `${SRC_DIR}/index.js`,
    },
    optimization: {
      // splitChunks: {
      //   // include all types of chunks
      //   chunks: 'all',
      // },
      //runtimeChunk: 'single',
      minimize: isProdBuild,
      sideEffects: true,
    },
    output: {
      // clean: true,
      publicPath: '/',
    },
    context: SRC_DIR,
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
    devServer: {
      open: true,
      port: 3000,
      historyApiFallback: true,
      headers: {
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'Cross-Origin-Opener-Policy': 'same-origin',
      },
    },
    cache: {
      type: 'filesystem',
    },
    module: {
      noParse: [/(codec)/, /(dicomicc)/],
      rules: [
        transpileJavaScriptRule(mode),
        loadWebWorkersRule,
        // loadShadersRule,
        {
          test: /\.m?js/,
          resolve: {
            fullySpecified: false,
          },
        },
        cssToJavaScript,
        {
          test: /\.wasm/,
          type: 'asset/resource',
        },
      ], //.concat(vtkRules),
    },
    resolve: {
      mainFields: ['module', 'browser', 'main'],
      alias: {
        // Viewer project
        '@': path.resolve(__dirname, '../platform/viewer/src'),
        '@components': path.resolve(
          __dirname,
          '../platform/viewer/src/components'
        ),
        '@hooks': path.resolve(__dirname, '../platform/viewer/src/hooks'),
        '@routes': path.resolve(__dirname, '../platform/viewer/src/routes'),
        '@state': path.resolve(__dirname, '../platform/viewer/src/state'),
        'dicom-microscopy-viewer':
          'dicom-microscopy-viewer/dist/dynamic-import/dicomMicroscopyViewer.min.js',
        '@cornerstonejs/dicom-image-loader':
          '@cornerstonejs/dicom-image-loader/dist/dynamic-import/cornerstoneDICOMImageLoader.min.js',
      },
      // Which directories to search when resolving modules
      modules: [
        // Modules specific to this package
        path.resolve(__dirname, '../node_modules'),
        // Hoisted Yarn Workspace Modules
        path.resolve(__dirname, '../../../node_modules'),
        path.resolve(__dirname, '../platform/viewer/node_modules'),
        path.resolve(__dirname, '../platform/ui/node_modules'),
        SRC_DIR,
      ],
      // Attempt to resolve these extensions in order.
      extensions: ['.js', '.jsx', '.json', '.ts', '.tsx', '*'],
      // symlinked resources are resolved to their real path, not their symlinked location
      symlinks: true,
      fallback: { fs: false, path: false, zlib: false },
    },
    plugins: [
      new webpack.DefinePlugin({
        /* Application */
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
        'process.env.DEBUG': JSON.stringify(process.env.DEBUG),
        'process.env.APP_CONFIG': JSON.stringify(process.env.APP_CONFIG || ''),
        'process.env.PUBLIC_URL': JSON.stringify(process.env.PUBLIC_URL || '/'),
        'process.env.VERSION_NUMBER': JSON.stringify(
          process.env.VERSION_NUMBER || PACKAGE.productVersion || ''
        ),
        'process.env.BUILD_NUM': JSON.stringify(BUILD_NUM),
        /* i18n */
        'process.env.USE_LOCIZE': JSON.stringify(process.env.USE_LOCIZE || ''),
        'process.env.LOCIZE_PROJECTID': JSON.stringify(
          process.env.LOCIZE_PROJECTID || ''
        ),
        'process.env.LOCIZE_API_KEY': JSON.stringify(
          process.env.LOCIZE_API_KEY || ''
        ),
        'process.env.REACT_APP_I18N_DEBUG': JSON.stringify(
          process.env.REACT_APP_I18N_DEBUG || ''
        ),
      }),
      // Uncomment to generate bundle analyzer
      // new BundleAnalyzerPlugin(),
    ],
  };

  if (isProdBuild) {
    config.optimization.minimizer = [
      new TerserJSPlugin({
        parallel: true,
        terserOptions: {},
      }),
    ];
  }

  if (isQuickBuild) {
    config.optimization.minimize = false;
    config.devtool = false;
  }

  return config;
};
