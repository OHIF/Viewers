// ~~ ENV
const dotenv = require('dotenv');
//
const path = require('path');
const webpack = require('webpack');
// ~~ RULES
const loadShadersRule = require('./rules/loadShaders.js');
const loadWebWorkersRule = require('./rules/loadWebWorkers.js');
const transpileJavaScriptRule = require('./rules/transpileJavaScript.js');
// ~~ PLUGINS
const TerserJSPlugin = require('terser-webpack-plugin');
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
    devtool: isProdBuild ? 'source-map' : 'eval-cheap-module-source-map',
    entry: {
      app: `${SRC_DIR}/index.js`,
    },
    optimization: {
      minimize: isProdBuild,
      sideEffects: true,
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
    module: {
      rules: [
        transpileJavaScriptRule(mode),
        loadWebWorkersRule,
        loadShadersRule,
      ],
    },
    resolve: {
      // Which directories to search when resolving modules
      modules: [
        // Modules specific to this package
        path.resolve(__dirname, '../node_modules'),
        // Hoisted Yarn Workspace Modules
        path.resolve(__dirname, '../../../node_modules'),
        SRC_DIR,
      ],
      // Attempt to resolve these extensions in order.
      extensions: ['.js', '.jsx', '.json', '*'],
      // symlinked resources are resolved to their real path, not their symlinked location
      symlinks: true,
    },
    plugins: [
      new webpack.DefinePlugin({
        /* Application */
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
        'process.env.DEBUG': JSON.stringify(process.env.DEBUG),
        'process.env.APP_CONFIG': JSON.stringify(process.env.APP_CONFIG || ''),
        'process.env.PUBLIC_URL': JSON.stringify(process.env.PUBLIC_URL || '/'),
        'process.env.VERSION_NUMBER': webpack.DefinePlugin.runtimeValue(() => {
          const package = require('../platform/viewer/package.json');
          return JSON.stringify(package.version || '');
        }, ['../platform/viewer/package.json']),
        'process.env.BUILD_NUM': JSON.stringify(BUILD_NUM),
        /* i18n */
        'process.env.USE_LOCIZE': JSON.stringify(process.env.USE_LOCIZE || ''),
        'process.env.LOCIZE_PROJECTID': JSON.stringify(process.env.LOCIZE_PROJECTID || ''),
        'process.env.LOCIZE_API_KEY': JSON.stringify(process.env.LOCIZE_API_KEY || ''),
      }),
    ],
    // Fix: https://github.com/webpack-contrib/css-loader/issues/447#issuecomment-285598881
    // For issue in cornerstone-wado-image-loader
    node: {
      fs: 'empty',
    },
  };

  if (isProdBuild) {
    config.optimization.minimizer = [
      new TerserJSPlugin({
        // Supports:
        // source-map and inline-source-map
        sourceMap: isProdBuild && !isQuickBuild,
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
