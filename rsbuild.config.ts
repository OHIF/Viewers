import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginNodePolyfill } from '@rsbuild/plugin-node-polyfill';
// `sources`/`Compilation` power the ported service-worker manifest plugin
// below; rsbuild runs rspack under the hood, so the same custom rspack plugin
// registered via tools.rspack.plugins behaves identically to rspack.pwa.js.
import { sources, Compilation } from '@rspack/core';
import path from 'path';
import writePluginImportsFile from './platform/app/.rspack/writePluginImportsFile';
// Module-resolution rules shared with the webpack/rspack build (rspack.base.js)
// so the two pipelines resolve identically.
import resolveConfig from './.rspack/resolveConfig';
import fs from 'fs';

const SRC_DIR = path.resolve(__dirname, './platform/app/src');
const DIST_DIR = path.resolve(__dirname, './platform/app/dist');
const PUBLIC_DIR = path.resolve(__dirname, './platform/app/public');

// Environment variables (similar to rspack.pwa.js)
const NODE_ENV = process.env.NODE_ENV;
// Production parity path: this config now serves BOTH `dev:fast` (dev server)
// and the production `rsbuild build` (gated on NODE_ENV=production). The prod
// path reproduces rspack.pwa.js's production behavior; see below.
const isProdBuild = NODE_ENV === 'production';
// e2e runs launch this same config (playwright webServer + `test:e2e`) with
// COVERAGE=true; used to disable the dev-server error overlay below, whose
// injected iframe intercepts pointer events and makes Playwright clicks miss.
const IS_COVERAGE = process.env.COVERAGE === 'true';
// Honor an explicit APP_CONFIG; otherwise mirror rspack.pwa.js — a production
// build gets the locked-down `config/default.js`, the dev server the
// full-featured `config/dev.js`.
const APP_CONFIG =
  process.env.APP_CONFIG || (isProdBuild ? 'config/default.js' : 'config/dev.js');
const PUBLIC_URL = process.env.PUBLIC_URL || '/';
// Matches rspack.pwa.js: allow an alternate html template (e.g. rollbar.html).
const HTML_TEMPLATE = process.env.HTML_TEMPLATE || 'index.html';

// Add these constants
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

// Ported verbatim from rspack.pwa.js so the production build emits the same
// `sw.js` with a populated `self.__WB_MANIFEST` and the SAME exclude list
// (`/theme/`, `/^plugins\//`). Registered through tools.rspack.plugins below.
class InjectServiceWorkerManifestPlugin {
  swSrc: string;
  swDest: string;
  publicPath: string;
  exclude: RegExp[];
  maximumFileSizeToCacheInBytes: number;

  constructor({ swSrc, swDest, publicPath, exclude, maximumFileSizeToCacheInBytes }) {
    this.swSrc = swSrc;
    this.swDest = swDest;
    this.publicPath = publicPath;
    this.exclude = exclude;
    this.maximumFileSizeToCacheInBytes = maximumFileSizeToCacheInBytes;
  }

  apply(compiler) {
    const pluginName = 'InjectServiceWorkerManifestPlugin';
    const publicPath = this.publicPath.endsWith('/') ? this.publicPath : `${this.publicPath}/`;

    compiler.hooks.thisCompilation.tap(pluginName, compilation => {
      compilation.hooks.processAssets.tap(
        {
          name: pluginName,
          stage: Compilation.PROCESS_ASSETS_STAGE_REPORT,
        },
        () => {
          const manifest = compilation
            .getAssets()
            .filter(asset => {
              if (asset.name === this.swDest || asset.name.endsWith('.map')) {
                return false;
              }
              if (this.exclude.some(pattern => pattern.test(asset.name))) {
                return false;
              }
              return asset.source.size() <= this.maximumFileSizeToCacheInBytes;
            })
            .map(asset => ({
              url: `${publicPath}${asset.name}`,
              revision: asset.info.contenthash ? null : compilation.hash,
            }));

          const source = fs
            .readFileSync(this.swSrc, 'utf8')
            .replace('self.__WB_MANIFEST', JSON.stringify(manifest));

          compilation.emitAsset(this.swDest, new sources.RawSource(source));
        }
      );
    });
  }
}

// The service worker is a production-only concern (dev:fast serves in memory);
// register it only for the prod build, matching rspack.pwa.js's IS_COVERAGE-
// gated push into `plugins`.
const rspackProdPlugins = isProdBuild
  ? [
      new InjectServiceWorkerManifestPlugin({
        swDest: 'sw.js',
        swSrc: path.join(SRC_DIR, 'service-worker.js'),
        publicPath: PUBLIC_URL,
        exclude: [/theme/, /^plugins\//],
        maximumFileSizeToCacheInBytes: 1024 * 1024 * 50,
      }),
    ]
  : [];

export default defineConfig({
  dev: {
    lazyCompilation: false,
    // During e2e (COVERAGE=true) disable the dev-server error overlay: its
    // injected iframe/web component intercepts pointer events and breaks
    // Playwright/Cypress clicks. Keep it for normal local dev. Ported from
    // rspack.pwa.js devServer.client.overlay (IS_COVERAGE ? false : ...).
    client: {
      overlay: !IS_COVERAGE,
    },
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
      // Sole build-time definer for e2e determinism hooks (`test:e2e` sets
      // TEST_ENV=true via cross-env; playwright's webServer runs this config).
      // Ported from rspack.base.js:58 — without it process.env.TEST_ENV stays
      // {} in the browser bundle and the stable series-sort / notification-
      // suppression e2e stabilizations silently disable.
      'process.env.TEST_ENV': JSON.stringify(process.env.TEST_ENV || ''),
    },
  },
  plugins: [pluginReact(), pluginNodePolyfill()],
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
      // Production-only rspack plugins (service worker); empty in dev.
      plugins: rspackProdPlugins,
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
          // e2e coverage instrumentation. The playwright webServer launches THIS
          // config with COVERAGE=true wrapped in `nyc`, and the fixtures
          // (tests/utils/fixture.ts via playwright-test-coverage) only HARVEST
          // window.__coverage__ — the bundle must be instrumented at build time
          // for that global to exist. Ported from the former rspack.pwa.js ->
          // rspack.base.js IS_COVERAGE rule (babel-loader + babel-plugin-istanbul).
          // Runs as a post-loader over rsbuild's SWC output; source maps thread the
          // coverage back to the original .ts/.tsx. Empty in every non-coverage
          // build, so dev:fast and the production build are untouched.
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
        ],
      },
      resolve: {
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
      // webpack/rspack build via ./.rspack/resolveConfig.
      ...resolveConfig.alias,
    },
  },
  output: {
    // Write the production build into platform/app/dist (same target as
    // rspack.pwa.js). In dev the bundle is served from memory, but keeping the
    // root consistent means the relative copy `to` paths below (google.js,
    // app-config.js) land next to the JS/HTML in both modes.
    distPath: {
      root: DIST_DIR,
    },
    // publicPath equivalent — rspack.pwa.js sets output.publicPath = PUBLIC_URL.
    assetPrefix: PUBLIC_URL,
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
    template: path.resolve(PUBLIC_DIR, `html-templates/${HTML_TEMPLATE}`),
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
