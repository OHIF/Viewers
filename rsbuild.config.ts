// An OHIF_ENV build profile supplies the defaults for PLUGIN_CONFIG /
// APP_CONFIG / PUBLIC_URL / HTML_TEMPLATE / proxy vars; anything already set in
// the environment wins. Applied here, above the module-scope constants below,
// because those capture process.env at import time. Call order relative to the
// other imports does not matter: applyBuildProfile() is memoized and
// writePluginImportsFile invokes it itself before reading PLUGIN_CONFIG (it is
// also loaded directly by platform/app/tailwind.config.js, which never goes
// through this file). See platform/app/ohif.schema.json and CUSTOMIZING.md.
import { applyBuildProfile } from './.rspack/loadBuildProfile';
applyBuildProfile();

import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginNodePolyfill } from '@rsbuild/plugin-node-polyfill';
import { pluginBabel } from '@rsbuild/plugin-babel';
import path from 'path';
import writePluginImportsFile from './platform/app/.rspack/writePluginImportsFile';
// Module-resolution rules shared with the per-package rspack builds
// (.rspack/rspack.base.js) so the two pipelines resolve identically.
import resolveConfig from './.rspack/resolveConfig';
// Service-worker manifest injection. Kept in its own module rather than inline
// so it stays bundler-version agnostic: it takes every rspack API off
// `compiler.webpack` inside apply() instead of importing @rspack/core.
import InjectServiceWorkerManifestPlugin from './platform/app/.rspack/InjectServiceWorkerManifestPlugin';
import fs from 'fs';

const APP_ROOT = path.resolve(__dirname, './platform/app');
const SRC_DIR = path.resolve(APP_ROOT, 'src');
const DIST_DIR = path.resolve(APP_ROOT, 'dist');
const PUBLIC_DIR = path.resolve(APP_ROOT, 'public');

const PUBLIC_URL = process.env.PUBLIC_URL || '/';
const HTML_TEMPLATE = process.env.HTML_TEMPLATE || 'index.html';
const ENTRY_TARGET = process.env.ENTRY_TARGET || `${SRC_DIR}/index.js`;

const BUILD_NUM = process.env.CIRCLE_BUILD_NUM || '0';
const VERSION_NUMBER = fs.readFileSync(path.join(__dirname, './version.txt'), 'utf8') || '';
const COMMIT_HASH = fs.readFileSync(path.join(__dirname, './commit.txt'), 'utf8') || '';
const PROXY_TARGET = process.env.PROXY_TARGET;
const PROXY_DOMAIN = process.env.PROXY_DOMAIN;
const PROXY_PATH_REWRITE_FROM = process.env.PROXY_PATH_REWRITE_FROM;
const PROXY_PATH_REWRITE_TO = process.env.PROXY_PATH_REWRITE_TO;
// e2e runs launch this same config (playwright webServer + `test:e2e`) with
// COVERAGE=true. It both instruments the bundle (see the babel-plugin-istanbul
// rule below) and disables the dev-server error overlay, whose injected iframe
// intercepts pointer events and makes Playwright clicks miss.
const IS_COVERAGE = process.env.COVERAGE === 'true';
const QUICK_BUILD = process.env.QUICK_BUILD === 'true';
const ENABLE_REACT_COMPILER = process.env.REACT_COMPILER !== 'off';

// Workspace source only (including plain .ts — hooks live there too), so the
// babel pass stays off node_modules and dev rebuilds stay fast. Legacy
// platform/ui is excluded: it is frozen and outside the app graph.
const REACT_COMPILER_INCLUDE = /(platform|extensions|modes)[\\/](?!ui[\\/])[^\\/]+[\\/]src[\\/].*\.[jt]sx?$/;

const OHIF_PORT = Number(process.env.OHIF_PORT || 3000);
const OHIF_OPEN = process.env.OHIF_OPEN !== 'false';

// Ignore node_modules except @cornerstonejs (symlinked local development).
const WATCH_IGNORED = /node_modules[\\/](?!@cornerstonejs(?:[\\/]|$))/;
const WATCH_AGGREGATE_TIMEOUT = Number(process.env.WATCH_AGGREGATE_TIMEOUT || 1500);

// `source-map-loader` is not a project dependency — it only serves the local
// cs3d-linking workflow (libs/@cornerstonejs, gitignored), so it is resolved
// opportunistically and the rule is skipped on installs that lack it.
const SOURCE_MAP_LOADER = (() => {
  try {
    return require.resolve('source-map-loader');
  } catch {
    return null;
  }
})();

export default defineConfig(({ env }) => {
  const isProd = env === 'production';
  // Honor an explicit APP_CONFIG; otherwise the dev server gets the
  // full-featured `config/dev.js` and a production build the locked-down
  // `config/default.js` (same policy as the former webpack.pwa.js).
  const APP_CONFIG = process.env.APP_CONFIG || (isProd ? 'config/default.js' : 'config/dev.js');

  return {
    root: APP_ROOT,
    dev: {
      lazyCompilation: false,
      assetPrefix: PUBLIC_URL,
      // Under e2e (COVERAGE=true) disable the dev-server error overlay: its
      // injected iframe/web component intercepts pointer events and breaks
      // Playwright/Cypress clicks. Keep it for normal local dev.
      client: {
        overlay: !IS_COVERAGE,
      },
    },
    source: {
      entry: {
        // `index` is the only entry name rsbuild routes to `/` (any other
        // name is served and printed as /<entryName>). The emitted bundles
        // keep the rspack build's legacy `app` naming via output.filename.
        index: ENTRY_TARGET,
      },
      define: {
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
        'process.env.NODE_DEBUG': JSON.stringify(process.env.NODE_DEBUG),
        'process.env.DEBUG': JSON.stringify(process.env.DEBUG),
        'process.env.PUBLIC_URL': JSON.stringify(PUBLIC_URL),
        'process.env.BUILD_NUM': JSON.stringify(BUILD_NUM),
        'process.env.VERSION_NUMBER': JSON.stringify(VERSION_NUMBER),
        'process.env.COMMIT_HASH': JSON.stringify(COMMIT_HASH),
        'process.env.USE_LOCIZE': JSON.stringify(process.env.USE_LOCIZE || ''),
        'process.env.LOCIZE_PROJECTID': JSON.stringify(process.env.LOCIZE_PROJECTID || ''),
        'process.env.LOCIZE_API_KEY': JSON.stringify(process.env.LOCIZE_API_KEY || ''),
        'process.env.REACT_APP_I18N_DEBUG': JSON.stringify(process.env.REACT_APP_I18N_DEBUG || ''),
        // Sole build-time definer for e2e determinism hooks (`test:e2e` sets
        // TEST_ENV=true via cross-env; playwright's webServer runs this config).
        // Ported from rspack.base.js — without it process.env.TEST_ENV stays
        // {} in the browser bundle and the stable series-sort / notification-
        // suppression e2e stabilizations silently disable.
        'process.env.TEST_ENV': JSON.stringify(process.env.TEST_ENV || ''),
        // Only redefine when unset, mirroring rspack.base.js (app-config.js is
        // loaded at runtime via a script tag; this define only silences the
        // process.env.APP_CONFIG references).
        ...(process.env.APP_CONFIG ? {} : { 'process.env.APP_CONFIG': "''" }),
      },
    },
    plugins: [
      pluginReact(),
      // React Compiler runs as a scoped babel pass on top of SWC (SWC has no
      // compiler transform). REACT_COMPILER=off is the kill switch, matching
      // the babel.config.js gate used by the rspack/jest pipelines.
      ...(ENABLE_REACT_COMPILER
        ? [
            pluginBabel({
              include: REACT_COMPILER_INCLUDE,
              // Per-file opt-outs are `'use no memo'` directives in the source
              // (see extensions/cornerstone/src/Viewport/), not a path list
              // here - a path list would have to be kept in sync with
              // babel.config.js by hand.
              exclude: /node_modules/,
              babelLoaderOptions(opts) {
                opts.plugins ??= [];
                opts.plugins.unshift(['babel-plugin-react-compiler', { target: '19' }]);
                // The plugin forces preset-typescript to parse every file as
                // TSX (allExtensions + isTSX), which rejects legal plain-.ts
                // syntax (angle-bracket casts, generic arrows). Let the preset
                // infer TS vs TSX from the file extension instead.
                opts.presets = opts.presets?.map(preset =>
                  Array.isArray(preset) && String(preset[0]).includes('preset-typescript')
                    ? [preset[0], {}]
                    : preset
                );
              },
            }),
          ]
        : []),
      pluginNodePolyfill(),
    ],
    tools: {
      // Keep the two index.html inline scripts (window.PUBLIC_URL bootstrap +
      // browserImportFunction) byte-faithful: rspack's html plugin minifies HTML
      // in production, which would rewrite the inline script bodies and change
      // the C13 CSP hashes. Disable html minification to preserve them.
      htmlPlugin: (config: Record<string, unknown>) => ({
        ...config,
        minify: false,
      }),
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
          noParse: [/(dicomicc)/],
          rules: [
            // e2e coverage instrumentation. The playwright webServer launches
            // THIS config with COVERAGE=true wrapped in `nyc`, and the fixtures
            // (tests/utils/fixture.ts via playwright-test-coverage) only HARVEST
            // window.__coverage__ — the bundle must be instrumented at build
            // time for that global to exist. Runs as a post-loader over
            // rsbuild's SWC output; source maps thread the coverage back to the
            // original .ts/.tsx. Empty in every non-coverage build, so dev and
            // the production build are untouched.
            ...(IS_COVERAGE
              ? [
                  {
                    test: /\.[jt]sx?$/,
                    exclude: /node_modules/,
                    enforce: 'post' as const,
                    use: [
                      {
                        loader: 'babel-loader',
                        options: {
                          babelrc: false,
                          configFile: false,
                          sourceMaps: true,
                          plugins: ['babel-plugin-istanbul'],
                        },
                      },
                    ],
                  },
                ]
              : []),
            // Consume the source maps emitted by the linked local Cornerstone
            // packages (libs/@cornerstonejs, via cs3d:link + cs3d:watch) so browser
            // stack traces and breakpoints resolve to the original .ts instead of
            // the bundled dist/esm .js. Scoped to the linked packages only.
            ...(SOURCE_MAP_LOADER
              ? [
                  {
                    test: /\.js$/,
                    enforce: 'pre' as const,
                    use: [SOURCE_MAP_LOADER],
                    include: /libs[\\/]@cornerstonejs[\\/]packages[\\/][^\\/]+[\\/]dist[\\/]esm/,
                  },
                ]
              : []),
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
            // Some ESM deps use extensionless relative imports; do not require
            // fully-specified paths for them (parity with rspack.base.js).
            {
              test: /\.m?js/,
              resolve: {
                fullySpecified: false,
              },
            },
          ],
        },
        resolve: {
          // Prefer ESM entry points in the same order as rspack.base.js.
          mainFields: ['module', 'browser', 'main'],
          // Extensions/modes are resolved from their source dirs (see the
          // resolve.alias above), so their imports of shared OHIF packages
          // (@ohif/ui-next, @ohif/core, ...) must resolve against platform/app's
          // installed dependencies rather than only the importer-relative
          // node_modules. Shared with rspack.base.js via ./.rspack/resolveConfig.
          modules: resolveConfig.getModules(SRC_DIR),
          fallback: {
            buffer: require.resolve('buffer'),
          },
        },
        optimization: {
          // Parity with rspack.base.js: several workspace/vendored packages
          // rely on side-effectful imports (global CSS, polyfills) without
          // declaring `sideEffects` in their package.json, so full
          // tree-shaking would silently drop them in production.
          sideEffects: false,
        },
        ...(isProd
          ? {
              output: {
                devtoolModuleFilenameTemplate: (info: { resourcePath: string }) =>
                  `webpack:///${info.resourcePath}`,
              },
            }
          : {}),
        // The service worker is a production-only concern (the dev server serves
        // in memory), and is skipped under coverage so the instrumented bundle
        // never gets precached.
        plugins:
          isProd && !IS_COVERAGE
            ? [
                new InjectServiceWorkerManifestPlugin({
                  swDest: 'sw.js',
                  swSrc: path.join(SRC_DIR, 'service-worker.js'),
                  publicPath: PUBLIC_URL,
                  // `plugins/` holds the runtime-loaded UMD extension bundles,
                  // resolved through window.config at boot rather than through
                  // the app graph, so they stay out of the precache.
                  exclude: [/theme/, /^plugins\//],
                  maximumFileSizeToCacheInBytes: 1024 * 1024 * 50,
                }),
              ]
            : [],
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
        // per-package rspack builds via ./.rspack/resolveConfig.
        ...resolveConfig.alias,
      },
    },
    output: {
      cleanDistPath: true,
      assetPrefix: PUBLIC_URL,
      // Legacy-compatible dist layout: bundles at the dist root (not static/js)
      // with the same `[name].bundle.<hash>` naming as the rspack build, so the
      // two outputs stay diffable and downstream tooling sees familiar paths.
      distPath: {
        root: DIST_DIR,
        js: '',
        jsAsync: '',
        css: '',
        cssAsync: '',
      },
      // The entry chunk is named `index` (for the root route) but must keep
      // emitting `app.*` files like the rspack build, so the two outputs stay
      // diffable and downstream tooling sees familiar paths. The HTML needs no
      // override anymore: `[name].html` now already yields index.html.
      filename: {
        js: isProd
          ? pathData =>
              pathData.chunk?.name === 'index'
                ? 'app.bundle.[contenthash:8].js'
                : '[name].bundle.[contenthash:8].js'
          : pathData => (pathData.chunk?.name === 'index' ? 'app.js' : '[name].js'),
        css: isProd
          ? pathData => (pathData.chunk?.name === 'index' ? 'app.bundle.css' : '[name].bundle.css')
          : pathData => (pathData.chunk?.name === 'index' ? 'app.css' : '[name].css'),
      },
      // JS/CSS are minified in prod by default. HTML is not: rsbuild 1.x
      // dropped built-in HTML minification (needs plugin-html-minifier-terser;
      // accepted diff vs the rspack build, which emitted minified HTML).
      minify: QUICK_BUILD ? false : undefined,
      // Match the rspack build: strip license comments without emitting
      // *.LICENSE.txt siblings (which would also inflate the sw.js precache).
      legalComments: 'none',
      sourceMap: {
        js: QUICK_BUILD ? false : isProd ? 'source-map' : 'cheap-module-source-map',
        css: isProd && !QUICK_BUILD,
      },
      copy: [
        // Copy plugin files (handled by writePluginImportsFile)
        ...(writePluginImportsFile(SRC_DIR, DIST_DIR) || []),
        // Copy public directory except config and html-templates
        {
          from: path.resolve(__dirname, 'node_modules/onnxruntime-web/dist'),
          to: `${DIST_DIR}/ort`,
          force: true,
        },
        // Copy the public directory except config/ and html-templates/.
        // Enumerated explicitly because CopyRspackPlugin's globOptions.ignore
        // is not reliably honored across the rspack versions bundled by
        // rsbuild vs the CLI.
        ...fs
          .readdirSync(PUBLIC_DIR)
          .filter(entry => !['config', 'html-templates', '.DS_Store'].includes(entry))
          .map(entry => {
            const from = path.join(PUBLIC_DIR, entry);
            return fs.statSync(from).isDirectory()
              ? { from, to: path.join(DIST_DIR, entry) }
              : { from, to: DIST_DIR };
          }),
        // Copy Google config
        {
          from: path.resolve(PUBLIC_DIR, 'config/google.js'),
          to: 'google.js',
        },
        // Copy app config. APP_CONFIG is normally relative to
        // platform/app/public; an absolute path is honored so a deployment can
        // keep its app config in its own repo (an OHIF_ENV profile turns a
        // './'-prefixed appConfig into exactly that — see loadBuildProfile.js).
        {
          from: path.isAbsolute(APP_CONFIG) ? APP_CONFIG : path.resolve(PUBLIC_DIR, APP_CONFIG),
          to: 'app-config.js',
        },
      ],
    },
    html: {
      template: path.resolve(PUBLIC_DIR, `html-templates/${HTML_TEMPLATE}`),
      templateParameters: {
        PUBLIC_URL,
      },
    },
    server: {
      // rsbuild 2 changed the default host from 0.0.0.0 to localhost; keep
      // binding all interfaces so the LAN (Network) URL works like before.
      host: '0.0.0.0',
      port: OHIF_PORT,
      open: OHIF_OPEN,
      // Disable rsbuild's built-in public-dir handling: it copies ALL of
      // platform/app/public into dist (including config/ and html-templates/).
      // The explicit output.copy patterns above replicate the rspack build's
      // selective copy instead.
      publicDir: false,
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
  };
});
