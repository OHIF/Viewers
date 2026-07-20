// ~~ ENV
const dotenv = require('dotenv');
//
const path = require('path');
const fs = require('fs');

const webpack = require('@rspack/core');

// ~~ PLUGINS
// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

// ~~ PackageJSON
// const vtkRules = require('vtk.js/Utilities/config/dependency.js')['webpack'].core
//   .rules;
// ~~ RULES
const loadWebWorkersRule = require('./rules/loadWebWorkers.js');
const transpileJavaScriptRule = require('./rules/transpileJavaScript.js');
const cssToJavaScript = require('./rules/cssToJavaScript.js');
// Module-resolution rules shared with the rsbuild build (see rsbuild.config.ts).
const resolveConfig = require('./resolveConfig');
// Only uncomment for old v2 stylus
// const stylusToJavaScript = require('./rules/stylusToJavaScript.js');
let ReactRefreshWebpackPlugin;
try {
  const mod = require('@rspack/plugin-react-refresh');
  ReactRefreshWebpackPlugin = mod.ReactRefreshRspackPlugin || mod.default || mod;
} catch { ReactRefreshWebpackPlugin = null; }

// ~~ ENV VARS
const NODE_ENV = process.env.NODE_ENV;
const QUICK_BUILD = process.env.QUICK_BUILD;
const BUILD_NUM = process.env.CIRCLE_BUILD_NUM || '0';
const IS_COVERAGE = process.env.COVERAGE === 'true';

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
  'process.env.TEST_ENV': JSON.stringify(process.env.TEST_ENV || ''),
};

// Only redefine updated values.  This avoids warning messages in the logs
if (!process.env.APP_CONFIG) {
  defineValues['process.env.APP_CONFIG'] = '';
}

module.exports = (env, argv, { SRC_DIR, ENTRY }) => {
  const mode = NODE_ENV === 'production' ? 'production' : 'development';
  const isProdBuild = NODE_ENV === 'production';
  const isQuickBuild = QUICK_BUILD === 'true';

  const config = {
    mode: isProdBuild ? 'production' : 'development',
    devtool: isProdBuild ? 'source-map' : 'cheap-module-source-map',
    // `rspack serve` (@rspack/cli) auto-enables lazyCompilation for web-only
    // apps unless the config defines it explicitly. The on-demand proxy chunks
    // it produces fail to load in the headless cypress/electron e2e run
    // (ChunkLoadError on cornerstone vendor chunks), so disable it here to match
    // the rsbuild build (see rsbuild.config.ts `dev.lazyCompilation: false`).
    lazyCompilation: false,
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
    cache: isProdBuild ? false : { type: 'filesystem' },
    module: {
      noParse: [/(dicomicc)/],
      rules: [
        ...(isProdBuild
          ? []
          : [
              ...(IS_COVERAGE
                ? [
                    {
                      test: /\.[jt]sx?$/,
                      exclude: /node_modules/,
                      use: {
                        loader: 'babel-loader',
                        options: {
                          presets: ['@babel/preset-typescript', '@babel/preset-react'],
                          plugins: ['istanbul'],
                        },
                      },
                    },
                  ]
                : [
                    {
                      test: /\.[jt]sx?$/,
                      exclude: /node_modules/,
                      loader: 'babel-loader',
                      options: {
                        plugins: isProdBuild ? [] : ['react-refresh/babel'],
                      },
                    },
                  ]),
            ]),
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
                              removeViewBox: false,
                            },
                          },
                        },
                      ],
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
        transpileJavaScriptRule(mode),
        loadWebWorkersRule,
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
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/i,
          type: 'asset/resource',
        },
      ], //.concat(vtkRules),
    },
    resolve: {
      mainFields: ['module', 'browser', 'main'],
      // alias and modules are shared with the rsbuild build via ./resolveConfig
      // so the two pipelines resolve identically.
      alias: {
        ...resolveConfig.alias,
      },
      modules: resolveConfig.getModules(SRC_DIR),
      // Attempt to resolve these extensions in order.
      extensions: ['.js', '.jsx', '.json', '.ts', '.tsx', '*'],
      // Workspace packages use relative imports between sibling packages.
      // Resolve symlinks to keep those imports anchored at the real package paths.
      symlinks: true,
      fallback: {
        fs: false,
        path: false,
        zlib: false,
        buffer: require.resolve('buffer'),
      },
    },
    node: {
      // Leave __filename / __dirname references alone. The previous 'mock'
      // value triggers an rspack warning whenever bundled deps reference
      // __dirname (e.g. Emscripten-compiled cornerstone codecs). Those refs
      // sit inside `if (ENVIRONMENT_IS_NODE)` branches that never execute in
      // the browser, so leaving them un-substituted is harmless at runtime.
      __filename: false,
      __dirname: false,
    },
    plugins: [
      new webpack.DefinePlugin(defineValues),
      new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
      }),
      new webpack.IgnorePlugin({
        resourceRegExp: /^(fs|path)$/,
        contextRegExp: /@cornerstonejs[\\/]codec-/,
      }),
      ...(isProdBuild || IS_COVERAGE || !ReactRefreshWebpackPlugin
        ? []
        : [new ReactRefreshWebpackPlugin({ overlay: false })]),
      // Uncomment to generate bundle analyzer
      // new BundleAnalyzerPlugin(),
    ],
  };

  if (isProdBuild) {
    config.optimization.minimizer = [new webpack.SwcJsMinimizerRspackPlugin()];
  }

  if (isQuickBuild) {
    config.optimization.minimize = false;
    config.devtool = false;
  }

  return config;
};
