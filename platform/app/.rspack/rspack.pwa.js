// https://developers.google.com/web/tools/workbox/guides/codelabs/webpack
// ~~ WebPack
const path = require('path');
const { merge } = require('webpack-merge');
const rspackBase = require('./../../../.rspack/rspack.base.js');
const rspack = require('@rspack/core');
// ~~ Plugins
const Dotenv = require('dotenv-webpack');
const writePluginImportFile = require('./writePluginImportsFile.js');
const { InjectManifest } = require('workbox-webpack-plugin');

// ~~ Directories
const SRC_DIR = path.join(__dirname, '../src');
const DIST_DIR = path.join(__dirname, '../dist');
const PUBLIC_DIR = path.join(__dirname, '../public');
// ~~ Env Vars
const HTML_TEMPLATE = process.env.HTML_TEMPLATE || 'index.html';
const PUBLIC_URL = process.env.PUBLIC_URL || '/';
const APP_CONFIG = process.env.APP_CONFIG || 'config/default.js';

// proxy settings
const PROXY_TARGET = process.env.PROXY_TARGET;
const PROXY_DOMAIN = process.env.PROXY_DOMAIN;
const PROXY_PATH_REWRITE_FROM = process.env.PROXY_PATH_REWRITE_FROM;
const PROXY_PATH_REWRITE_TO = process.env.PROXY_PATH_REWRITE_TO;

const OHIF_PORT = Number(process.env.OHIF_PORT || 3000);
const ENTRY_TARGET = process.env.ENTRY_TARGET || `${SRC_DIR}/index.js`;

const copyPluginFromExtensions = writePluginImportFile(SRC_DIR, DIST_DIR);

const setHeaders = (res, path) => {
  if (path.indexOf('.gz') !== -1) {
    res.setHeader('Content-Encoding', 'gzip');
  } else if (path.indexOf('.br') !== -1) {
    res.setHeader('Content-Encoding', 'br');
  }
  if (path.indexOf('.pdf') !== -1) {
    res.setHeader('Content-Type', 'application/pdf');
  } else if (path.indexOf('mp4') !== -1) {
    res.setHeader('Content-Type', 'video/mp4');
  } else if (path.indexOf('frames') !== -1) {
    res.setHeader('Content-Type', 'multipart/related');
  } else {
    res.setHeader('Content-Type', 'application/json');
  }
};

module.exports = (env, argv) => {
  const baseConfig = rspackBase(env, argv, { SRC_DIR, DIST_DIR });
  const isProdBuild = process.env.NODE_ENV === 'production';
  const hasProxy = PROXY_TARGET && PROXY_DOMAIN;

  const mergedConfig = merge(baseConfig, {
    entry: {
      app: ENTRY_TARGET,
    },
    output: {
      path: DIST_DIR,
      clean: true,
      filename: isProdBuild ? '[name].bundle.[chunkhash].js' : '[name].js',
      publicPath: PUBLIC_URL,
      devtoolModuleFilenameTemplate: function (info) {
        if (isProdBuild) {
          return `rspack:///${info.resourcePath}`;
        } else {
          return 'file:///' + encodeURI(info.absoluteResourcePath);
        }
      },
    },
    resolve: {
      modules: [
        path.resolve(__dirname, '../node_modules'),
        path.resolve(__dirname, '../../../node_modules'),
        SRC_DIR,
      ],
    },
    plugins: [
      // new Dotenv(),
      new rspack.CopyRspackPlugin({
        patterns: [
          ...copyPluginFromExtensions,
          {
            from: PUBLIC_DIR,
            to: DIST_DIR,
            toType: 'dir',
            globOptions: {
              ignore: ['**/config/**', '**/html-templates/**', '.DS_Store'],
            },
          },
          {
            from: `${PUBLIC_DIR}/config/google.js`,
            to: `${DIST_DIR}/google.js`,
          },
          {
            from: `${PUBLIC_DIR}/${APP_CONFIG}`,
            to: `${DIST_DIR}/app-config.js`,
          },
          {
            from: '../../../node_modules/dicom-microscopy-viewer/dist/dynamic-import',
            to: DIST_DIR,
            globOptions: {
              ignore: ['**/*.min.js.map'],
            },
          },
        ],
      }),
      new rspack.HtmlRspackPlugin({
        template: `${PUBLIC_DIR}/html-templates/${HTML_TEMPLATE}`,
        filename: 'index.html',
        templateParameters: {
          PUBLIC_URL: PUBLIC_URL,
        },
      }),
      // new InjectManifest({
      //   swDest: 'sw.js',
      //   swSrc: path.join(SRC_DIR, 'service-worker.js'),
      //   exclude: [/theme/],
      //   maximumFileSizeToCacheInBytes: 1024 * 1024 * 50,
      // }),
    ],
    devServer: {
      open: true,
      port: OHIF_PORT,
      client: {
        overlay: { errors: true, warnings: false },
      },
      proxy: [
        {
          context: '/dicomweb',
          target: 'http://localhost:5000',
        },
      ],
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
      historyApiFallback: {
        disableDotRule: true,
        index: PUBLIC_URL + 'index.html',
      },
      devMiddleware: {
        writeToDisk: true,
      },
    },
    // builtins: {
    //   react: {
    //     runtime: 'automatic',
    //     development: !isProdBuild,
    //     refresh: !isProdBuild,
    //   },
    // },
  });

  if (hasProxy) {
    mergedConfig.devServer.proxy = mergedConfig.devServer.proxy || [];
    mergedConfig.devServer.proxy.push({
      context: PROXY_TARGET,
      target: PROXY_DOMAIN,
      changeOrigin: true,
      pathRewrite: {
        [`^${PROXY_PATH_REWRITE_FROM}`]: PROXY_PATH_REWRITE_TO,
      },
    });
  }

  if (isProdBuild) {
    mergedConfig.plugins.push(
      new rspack.CssExtractRspackPlugin({
        filename: '[name].bundle.css',
        chunkFilename: '[id].css',
      })
    );
  }

  mergedConfig.watchOptions = {
    ignored: /node_modules\/@cornerstonejs/,
  };

  return mergedConfig;
};
