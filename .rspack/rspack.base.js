// ~~ ENV
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const rspack = require('@rspack/core');

// ~~ ENV VARS
const NODE_ENV = process.env.NODE_ENV;
const QUICK_BUILD = process.env.QUICK_BUILD;
const BUILD_NUM = process.env.CIRCLE_BUILD_NUM || '0';
const ReactRefreshPlugin = require('@rspack/plugin-react-refresh');

// read from ../version.txt
const VERSION_NUMBER = fs.readFileSync(path.join(__dirname, '../version.txt'), 'utf8') || '';
const COMMIT_HASH = fs.readFileSync(path.join(__dirname, '../commit.txt'), 'utf8') || '';

dotenv.config();

// Define values remain the same
const defineValues = {
  /* Application */
  'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  'process.env.NODE_DEBUG': JSON.stringify(process.env.NODE_DEBUG || ''),
  'process.env.DEBUG': JSON.stringify(process.env.DEBUG || ''),
  'process.env.PUBLIC_URL': JSON.stringify(process.env.PUBLIC_URL || '/'),
  'process.env.BUILD_NUM': JSON.stringify(BUILD_NUM || '0'),
  'process.env.VERSION_NUMBER': JSON.stringify(VERSION_NUMBER || ''),
  'process.env.COMMIT_HASH': JSON.stringify(COMMIT_HASH || ''),
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
  const isProdBuild = NODE_ENV === 'production';
  const isQuickBuild = QUICK_BUILD === 'true';

  const config = {
    experiments: {
      css: true,
    },
    mode: isProdBuild ? 'production' : 'development',
    devtool: isProdBuild ? 'source-map' : 'cheap-module-source-map',
    entry: ENTRY,
    optimization: {
      minimize: isProdBuild,
      sideEffects: false,
    },
    output: {
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
      noParse: [/(dicomicc)/],
      rules: [
        {
          test: /\.[jt]sx?$/,
          exclude: /node_modules/,
          loader: 'builtin:swc-loader',
          options: {
            jsc: {
              parser: {
                syntax: 'typescript',
                tsx: true,
              },
              transform: {
                react: {
                  development: !isProdBuild,
                  refresh: !isProdBuild,
                },
              },
            },
            env: {
              targets: 'Chrome >= 48',
            },
          },
        },
        // {
        //   test: /\.svg$/,
        //   type: 'asset/resource',
        //   use: [
        //     {
        //       loader: '@svgr/webpack',
        //       options: {
        //         svgoConfig: {
        //           plugins: [
        //             {
        //               name: 'preset-default',
        //               params: {
        //                 overrides: {
        //                   removeViewBox: false,
        //                 },
        //               },
        //             },
        //           ],
        //         },
        //         prettier: false,
        //         svgo: true,
        //         titleProp: true,
        //       },
        //     },
        //   ],
        // },
        {
          test: /\.svg$/i,
          issuer: /\.[jt]sx?$/,
          use: ['@svgr/webpack'],
        },
        {
          test: /\.css$/,
          use: [
            {
              loader: 'postcss-loader',
              options: {
                postcssOptions: {
                  plugins: {
                    tailwindcss: {},
                    autoprefixer: {},
                  },
                },
              },
            },
          ],
          type: 'css',
        },
        {
          test: /\.wasm$/,
          type: 'asset/resource',
        },
        {
          test: /\.(png|jpe?g|gif)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'assets/images/[name][ext]',
          },
        },
      ],
    },
    resolve: {
      mainFields: ['module', 'browser', 'main'],
      alias: {
        '@': path.resolve(__dirname, '../platform/app/src'),
        '@components': path.resolve(__dirname, '../platform/app/src/components'),
        '@hooks': path.resolve(__dirname, '../platform/app/src/hooks'),
        '@routes': path.resolve(__dirname, '../platform/app/src/routes'),
        '@state': path.resolve(__dirname, '../platform/app/src/state'),
        'dicom-microscopy-viewer':
          'dicom-microscopy-viewer/dist/dynamic-import/dicomMicroscopyViewer.min.js',
      },
      modules: [
        path.resolve(__dirname, '../node_modules'),
        path.resolve(__dirname, '../../../node_modules'),
        path.resolve(__dirname, '../platform/app/node_modules'),
        path.resolve(__dirname, '../platform/ui/node_modules'),
        SRC_DIR,
      ],
      extensions: ['.js', '.jsx', '.json', '.ts', '.tsx', '*'],
      symlinks: true,
      fallback: {
        fs: false,
        path: false,
        zlib: false,
        buffer: require.resolve('buffer'),
      },
    },
    plugins: [
      new rspack.DefinePlugin(defineValues),
      new rspack.CssExtractRspackPlugin({}),
      new rspack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
      }),
      ...(isProdBuild ? [] : [new ReactRefreshPlugin()]),
    ],
  };

  if (isQuickBuild) {
    config.optimization.minimize = false;
    config.devtool = false;
  }

  return config;
};
