import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginNodePolyfill } from '@rsbuild/plugin-node-polyfill';
import path from 'path';
import writePluginImportsFile from './platform/app/.webpack/writePluginImportsFile';
// Module-resolution rules shared with the webpack/rspack build (webpack.base.js)
// so the two pipelines resolve identically.
import resolveConfig from './.webpack/resolveConfig';
import fs from 'fs';

const SRC_DIR = path.resolve(__dirname, './platform/app/src');
const DIST_DIR = path.resolve(__dirname, './platform/app/dist');
const PUBLIC_DIR = path.resolve(__dirname, './platform/app/public');

// Environment variables (similar to webpack.pwa.js)
const APP_CONFIG = process.env.APP_CONFIG || 'config/default.js';
const PUBLIC_URL = process.env.PUBLIC_URL || '/';

// Add these constants
const NODE_ENV = process.env.NODE_ENV;
const BUILD_NUM = process.env.CIRCLE_BUILD_NUM || '0';
const VERSION_NUMBER = fs.readFileSync(path.join(__dirname, './version.txt'), 'utf8') || '';
const COMMIT_HASH = fs.readFileSync(path.join(__dirname, './commit.txt'), 'utf8') || '';
const PROXY_TARGET = process.env.PROXY_TARGET;
const PROXY_DOMAIN = process.env.PROXY_DOMAIN;
const PROXY_PATH_REWRITE_FROM = process.env.PROXY_PATH_REWRITE_FROM;
const PROXY_PATH_REWRITE_TO = process.env.PROXY_PATH_REWRITE_TO;

// Add port constant
const OHIF_PORT = Number(process.env.OHIF_PORT || 3000);
const OHIF_OPEN = process.env.OHIF_OPEN !== 'false';

// Ignore node_modules except @cornerstonejs (symlinked local development).
const WATCH_IGNORED = /node_modules[\\/](?!@cornerstonejs(?:[\\/]|$))/;
const WATCH_AGGREGATE_TIMEOUT = Number(process.env.WATCH_AGGREGATE_TIMEOUT || 1500);

export default defineConfig({
  dev: {
    lazyCompilation: false,
  },
  source: {
    entry: {
      index: `${SRC_DIR}/index.js`,
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
      'process.env.NODE_DEBUG': JSON.stringify(process.env.NODE_DEBUG),
      'process.env.DEBUG': JSON.stringify(process.env.DEBUG),
      'process.env.PUBLIC_URL': JSON.stringify(process.env.PUBLIC_URL || '/'),
      'process.env.BUILD_NUM': JSON.stringify(BUILD_NUM),
      'process.env.VERSION_NUMBER': JSON.stringify(VERSION_NUMBER),
      'process.env.COMMIT_HASH': JSON.stringify(COMMIT_HASH),
      'process.env.USE_LOCIZE': JSON.stringify(process.env.USE_LOCIZE || ''),
      'process.env.LOCIZE_PROJECTID': JSON.stringify(process.env.LOCIZE_PROJECTID || ''),
      'process.env.LOCIZE_API_KEY': JSON.stringify(process.env.LOCIZE_API_KEY || ''),
      'process.env.REACT_APP_I18N_DEBUG': JSON.stringify(process.env.REACT_APP_I18N_DEBUG || ''),
    },
  },
  plugins: [pluginReact(), pluginNodePolyfill()],
  tools: {
    rspack: {
      experiments: {
        asyncWebAssembly: true,
      },
      // Leave __filename / __dirname references alone. rsbuild's default
      // ('warn-mock') noisily warns whenever bundled deps reference them
      // (e.g. Emscripten-compiled cornerstone codecs). Those references sit
      // inside `if (ENVIRONMENT_IS_NODE)` branches that never execute in the
      // browser, so leaving them un-substituted is harmless at runtime.
      node: {
        __filename: false,
        __dirname: false,
      },
      module: {
        rules: [
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
            type: 'javascript/auto',
          },
          {
            test: /\.wasm$/,
            type: 'asset/resource',
          },
        ],
      },
      resolve: {
        // Extensions/modes are resolved from their source dirs (see the
        // resolve.alias above), so their imports of shared OHIF packages
        // (@ohif/ui-next, @ohif/core, ...) must resolve against platform/app's
        // installed dependencies rather than only the importer-relative
        // node_modules. Shared with webpack.base.js via ./.webpack/resolveConfig.
        modules: resolveConfig.getModules(SRC_DIR),
        fallback: {
          buffer: require.resolve('buffer'),
        },
      },
      watchOptions: {
        ignored: WATCH_IGNORED,
        followSymlinks: true,
        aggregateTimeout: WATCH_AGGREGATE_TIMEOUT,
      },
    },
  },
  resolve: {
    alias: {
      // Resolve every extension/mode declared in pluginConfig.json to its
      // source directory, so the dynamic import()s in the generated
      // pluginImports.js link without the plugins being dependencies of
      // platform/app. Merged in separately since it depends on pluginConfig.json.
      ...writePluginImportsFile.getPluginResolveAliases(),
      // App-level aliases (@ohif/app, @, @components, ...) shared with the
      // webpack/rspack build via ./.webpack/resolveConfig.
      ...resolveConfig.alias,
    },
  },
  output: {
    copy: [
      // Copy plugin files (handled by writePluginImportsFile)
      ...(writePluginImportsFile(SRC_DIR, DIST_DIR) || []),
      // Copy public directory except config and html-templates
      {
        from: path.resolve(__dirname, 'node_modules/onnxruntime-web/dist'),
        to: `${DIST_DIR}/ort`,
        force: true,
      },
      {
        from: PUBLIC_DIR,
        to: DIST_DIR,
        globOptions: {
          ignore: ['**/config/**', '**/html-templates/**', '.DS_Store'],
        },
      },
      // Copy Google config
      {
        from: path.resolve(PUBLIC_DIR, 'config/google.js'),
        to: 'google.js',
      },
      // Copy app config
      {
        from: path.resolve(PUBLIC_DIR, APP_CONFIG),
        to: 'app-config.js',
      },
    ],
  },
  html: {
    template: path.resolve(PUBLIC_DIR, 'html-templates/index.html'),
    templateParameters: {
      PUBLIC_URL,
    },
  },
  server: {
    port: OHIF_PORT,
    open: OHIF_OPEN,
    // Configure proxy
    proxy: {
      '/dicomweb': {
        target: 'http://localhost:5000',
      },
      // Add conditional proxy based on env vars
      ...(PROXY_TARGET && PROXY_DOMAIN
        ? {
            [PROXY_TARGET]: {
              target: PROXY_DOMAIN,
              changeOrigin: true,
              pathRewrite: {
                [`^${PROXY_PATH_REWRITE_FROM}`]: PROXY_PATH_REWRITE_TO,
              },
            },
          }
        : {}),
    },
    // Configure history API fallback
    historyApiFallback: {
      disableDotRule: true,
      index: `${PUBLIC_URL}index.html`,
    },
  },
});
