import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginNodePolyfill } from '@rsbuild/plugin-node-polyfill';
import path from 'path';
import writePluginImportsFile from './platform/app/.webpack/writePluginImportsFile';
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

// Generate local-override-config.js at project root so output.copy can include it in dist/.
// It patches window.config right after app-config.js loads.
// dataSources is merged by sourceName: existing entries are updated, new ones are appended.
const LOCAL_OVERRIDE_PATH = path.resolve(PUBLIC_DIR, 'config/local.override.json');
const LOCAL_OVERRIDE_JS_PATH = path.resolve(__dirname, '.local-override-config.js');
if (fs.existsSync(LOCAL_OVERRIDE_PATH)) {
  const override = JSON.parse(fs.readFileSync(LOCAL_OVERRIDE_PATH, 'utf8'));
  // Ancien code (simple, sans merge dataSources par sourceName) :
  // fs.writeFileSync(
  //   LOCAL_OVERRIDE_JS_PATH,
  //   `(function(){var o=${JSON.stringify(override)};if(!window.config)return;Object.keys(o).forEach(function(k){if(o[k]&&typeof o[k]==='object'&&!Array.isArray(o[k])&&window.config[k]&&typeof window.config[k]==='object'){Object.assign(window.config[k],o[k])}else{window.config[k]=o[k]}})})();\n`
  // );
  const overrideIIFE = `(function(){
var o=${JSON.stringify(override)};
if(!window.config)return;
Object.keys(o).forEach(function(k){
  if(k==='dataSources'&&Array.isArray(o[k])&&Array.isArray(window.config[k])){
    o[k].forEach(function(ds){
      var idx=window.config[k].findIndex(function(e){return e.sourceName===ds.sourceName});
      if(idx!==-1){
        var cfg=window.config[k][idx].configuration||{};
        if(ds.configuration){Object.assign(cfg,ds.configuration)}
        Object.assign(window.config[k][idx],ds);
        window.config[k][idx].configuration=cfg;
      }else{
        window.config[k].push(ds);
      }
    });
  }else if(o[k]&&typeof o[k]==='object'&&!Array.isArray(o[k])&&window.config[k]&&typeof window.config[k]==='object'){
    Object.assign(window.config[k],o[k]);
  }else{
    window.config[k]=o[k];
  }
});
})();`;
  fs.writeFileSync(LOCAL_OVERRIDE_JS_PATH, overrideIIFE + '\n');
} else {
  fs.writeFileSync(LOCAL_OVERRIDE_JS_PATH, '');
}

export default defineConfig({
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
        fallback: {
          buffer: require.resolve('buffer'),
        },
      },
      watchOptions: {
        ignored: /node_modules\/@cornerstonejs/,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './platform/app/src'),
      '@components': path.resolve(__dirname, './platform/app/src/components'),
      '@hooks': path.resolve(__dirname, './platform/app/src/hooks'),
      '@routes': path.resolve(__dirname, './platform/app/src/routes'),
      '@state': path.resolve(__dirname, './platform/app/src/state'),
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
      // Copy local override config (generated above from local.override.json)
      {
        from: LOCAL_OVERRIDE_JS_PATH,
        to: 'local-override-config.js',
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
      '/ekko-pacs-api': {
        target: 'https://nheuze-pacsia-dev84.edreams-factory.com',
        changeOrigin: true,
        secure: true,
        pathRewrite: { '^/ekko-pacs-api': '' },
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
