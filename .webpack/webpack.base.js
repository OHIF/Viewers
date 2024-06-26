// ~~ ENV
const dotenv = require('dotenv');
//
const path = require('path');
const fs = require('fs');

const webpack = require('webpack');

// ~~ PLUGINS
// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const TerserJSPlugin = require('terser-webpack-plugin');

// ~~ PackageJSON
// const vtkRules = require('vtk.js/Utilities/config/dependency.js').webpack.core
//   .rules;
// ~~ RULES
const loadShadersRule = require('./rules/loadShaders.js');
const loadWebWorkersRule = require('./rules/loadWebWorkers.js');
const transpileJavaScriptRule = require('./rules/transpileJavaScript.js');
const cssToJavaScript = require('./rules/cssToJavaScript.js');
const stylusToJavaScript = require('./rules/stylusToJavaScript.js');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');


// ~~ ENV VARS
const NODE_ENV = process.env.NODE_ENV;
const QUICK_BUILD = process.env.QUICK_BUILD;
const BUILD_NUM = process.env.CIRCLE_BUILD_NUM || '0';

// read from ../version.txt
const VERSION_NUMBER = fs.readFileSync(path.join(__dirname, '../version.txt'), 'utf8') || '';

const COMMIT_HASH = fs.readFileSync(path.join(__dirname, '../commit.txt'), 'utf8') || '';

//
dotenv.config();

const defineValues = {
  /* Application */
  'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
  'process.env.NODE_DEBUG': JSON.stringify(process.env.NODE_DEBUG),
  'process.env.DEBUG': JSON.stringify(process.env.DEBUG),
  'process.env.PUBLIC_URL': JSON.stringify(process.env.PUBLIC_URL || '/'),
  'process.env.BUILD_NUM': JSON.stringify(BUILD_NUM),
  'process.env.VERSION_NUMBER': JSON.stringify(VERSION_NUMBER),
  'process.env.COMMIT_HASH': JSON.stringify(COMMIT_HASH),
  /* i18n */
  'process.env.USE_LOCIZE': JSON.stringify(process.env.USE_LOCIZE || ''),
  'process.env.LOCIZE_PROJECTID': JSON.stringify(process.env.LOCIZE_PROJECTID || ''),
  'process.env.LOCIZE_API_KEY': JSON.stringify(process.env.LOCIZE_API_KEY || ''),
  'process.env.REACT_APP_I18N_DEBUG': JSON.stringify(process.env.REACT_APP_I18N_DEBUG || ''),
};

// Only redefine updated values.  This avoids warning messages in the logs
if (!process.env.APP_CONFIG) {
  defineValues['process.env.APP_CONFIG'] = '';
}

module.exports = (env, argv, { SRC_DIR, ENTRY }) => {
  if (!process.env.NODE_ENV) {
    throw new Error('process.env.NODE_ENV not set');
  }

  const mode = NODE_ENV === 'production' ? 'production' : 'development';
  const isProdBuild = NODE_ENV === 'production';
  const isQuickBuild = QUICK_BUILD === 'true';

  const config = {
    mode: isProdBuild ? 'production' : 'development',
    devtool: isProdBuild ? 'source-map' : 'cheap-module-source-map',
    entry: ENTRY,
    optimization: {
      // splitChunks: {
      //   // include all types of chunks
      //   chunks: 'all',
      // },
      //runtimeChunk: 'single',
      minimize: isProdBuild,
      sideEffects: false,
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
    cache: {
      type: 'filesystem',
    },
    module: {
      noParse: [/(codec)/, /(dicomicc)/],
      rules: [
        ...(isProdBuild ? [] : [{
          test: /\.[jt]sx?$/,
          exclude: /node_modules/,
          loader: 'babel-loader',
          options: {
            plugins: ['react-refresh/babel'],
          },
        }]),
        {
          test: /\.svg?$/,
          oneOf: [
            {
              use: [
                {
                  loader: '@svgr/webpack',
                  options: {
                    svgoConfig: {
                      plugins: [
                        {
                          name: 'preset-default',
                          params: {
                            overrides: {
                              removeViewBox: false
                            },
                          },
                        },
                      ]
                    },
                    prettier: false,
                    svgo: true,
                    titleProp: true,
                  },
                },
              ],
              issuer: {
                and: [/\.(ts|tsx|js|jsx|md|mdx)$/],
              },
            },
          ],
        },
        {
          test: /\.js$/,
          enforce: 'pre',
          use: 'source-map-loader',
        },
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
        // Note: Only uncomment the following if you are using the old style of stylus in v2
        // Also you need to uncomment this platform/app/.webpack/rules/extractStyleChunks.js
        // stylusToJavaScript,
        {
          test: /\.wasm/,
          type: 'asset/resource',
        },
        {
          test: /\.(png|jpe?g|gif|svg)$/i,
          use: [
            {
              loader: 'file-loader',
              options: {
                name: 'assets/images/[name].[ext]',
              },
            },
          ],
        },
      ], //.concat(vtkRules),
    },
    resolve: {
      mainFields: ['module', 'browser', 'main'],
      alias: {
        // Viewer project
        '@': path.resolve(__dirname, '../platform/app/src'),
        '@components': path.resolve(__dirname, '../platform/app/src/components'),
        '@hooks': path.resolve(__dirname, '../platform/app/src/hooks'),
        '@routes': path.resolve(__dirname, '../platform/app/src/routes'),
        '@state': path.resolve(__dirname, '../platform/app/src/state'),
        '@cornerstonejs/dicom-image-loader':
          '@cornerstonejs/dicom-image-loader/dist/dynamic-import/cornerstoneDICOMImageLoader.min.js',
      },
      // Which directories to search when resolving modules
      modules: [
        // Modules specific to this package
        path.resolve(__dirname, '../node_modules'),
        // Hoisted Yarn Workspace Modules
        path.resolve(__dirname, '../../../node_modules'),
        path.resolve(__dirname, '../platform/app/node_modules'),
        path.resolve(__dirname, '../platform/ui/node_modules'),
        SRC_DIR,
      ],
      // Attempt to resolve these extensions in order.
      extensions: ['.js', '.jsx', '.json', '.ts', '.tsx', '*'],
      // symlinked resources are resolved to their real path, not their symlinked location
      symlinks: true,
      fallback: {
        fs: false,
        path: false,
        zlib: false,
        buffer: require.resolve('buffer'),
      },
    },
    plugins: [
      new webpack.DefinePlugin(defineValues),
      new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
      }),
      ...(isProdBuild ? [] : [new ReactRefreshWebpackPlugin()]),
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
