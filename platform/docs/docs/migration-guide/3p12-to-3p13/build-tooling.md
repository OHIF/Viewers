---
sidebar_position: 4
sidebar_label: Build Tooling (Rspack)
title: Webpack to Rspack v2
summary: 3.13 swaps Webpack for Rspack v2 across the monorepo. This guide covers the new build commands, plugin replacements, and how to update custom extensions that ship their own webpack config.
---

# Webpack to Rspack v2

OHIF 3.13 replaces Webpack with [Rspack](https://rspack.dev) v2 as the
default bundler for the app, every extension, every mode, and the
`@ohif/ui-next` / `@ohif/ui` / `@ohif/i18n` / `@ohif/core` packages.

:::caution The `.webpack/` files are now Rspack configs
The directory layout and filenames are unchanged — you will still find
`.webpack/webpack.base.js`, `.webpack/webpack.pwa.js`, and a
`.webpack/webpack.prod.js` in each package. **Despite the `webpack` name,
these files now configure Rspack.** They `require('@rspack/core')` (aliased
to a local `webpack` variable so the rest of the config reads the same) and
are run by the `rspack` CLI. The names were kept to minimize churn and keep
custom-extension forks merging cleanly — do not assume a file called
`webpack.*.js` runs Webpack.
:::

There is no Webpack fallback. Webpack and all of its plugins have been
removed from the dependency tree; the only supported bundler is Rspack
(plus Rsbuild for the `dev:fast` path, see below).

## Why Rspack

Rspack is API-compatible with most of the Webpack v5 plugin ecosystem
but written in Rust. For the OHIF tree the practical wins are:

- 3-5x faster cold builds and `--watch` rebuilds.
- Built-in SWC minification (no separate `terser-webpack-plugin`).
- First-party drop-in replacements for the plugins that previously
  ate the bulk of build time (`MiniCssExtractPlugin`, `CopyWebpackPlugin`,
  `HtmlWebpackPlugin`).

## New scripts

`platform/app/package.json` was rewritten to invoke `rspack` instead of
`webpack`:

```diff
- "build": "node --max_old_space_size=8096 ./../../node_modules/webpack/bin/webpack.js --progress --config .webpack/webpack.pwa.js",
+ "build": "cross-env NODE_OPTIONS=--max-old-space-size=24576 rspack build --config .webpack/webpack.pwa.js",
- "dev": "cross-env NODE_ENV=development webpack serve --config .webpack/webpack.pwa.js",
+ "dev": "cross-env NODE_ENV=development rspack serve --config .webpack/webpack.pwa.js",
- "dev:orthanc": "… webpack serve --config .webpack/webpack.pwa.js",
+ "dev:orthanc": "… rspack serve --config .webpack/webpack.pwa.js"
```

Notes:

- The build now requests `--max-old-space-size=24576` (24 GB) via
  `NODE_OPTIONS`. The previous 8 GB limit is no longer enough for full
  prod builds.
- `webpack serve` is replaced by `rspack serve`. All `dev:*` variants
  (`dev:orthanc`, `dev:dcm4chee`, `dev:static`, …) were updated the same way.
- `dev:no:cache` no longer passes `--no-cache` (Rspack's CLI does not
  expose it). It is now identical to `dev`; production caching is disabled
  unconditionally in the config instead (see "Caching" below).
- `dev:fast` runs **Rsbuild** rather than Rspack directly
  (`rsbuild dev --config ../../rsbuild.config.ts`). Rsbuild is the
  higher-level toolchain built on Rspack; it is used only for the fast
  dev-server path and is configured separately in `rsbuild.config.ts`.

## Dependency changes

`platform/app/package.json` (and every other workspace package that ships a
`.webpack/webpack.prod.js`) **adds**:

```json
{
  "devDependencies": {
    "@rspack/cli": "^2.0.0",
    "@rspack/core": "^2.0.0",
    "@rspack/dev-server": "^2.0.0",
    "@rspack/plugin-react-refresh": "^2.0.0"
  }
}
```

and **removes** the Webpack toolchain that is no longer used:

```diff
- "webpack": "5.105.0",
- "@pmmmwh/react-refresh-webpack-plugin": "0.5.17",
- "clean-webpack-plugin": "4.0.0",
- "copy-webpack-plugin": "10.2.4",
- "html-webpack-plugin": "5.6.3",
- "terser-webpack-plugin": "5.3.14",
- "webpack-dev-server": "5.2.2",
- "workbox-webpack-plugin": "6.6.1",
- "dotenv-webpack": "1.8.0",
- "extract-css-chunks-webpack-plugin": "4.10.0",
```

(`webpack-merge` is kept — Rspack configs still use it to merge the base
and per-package configs.)

The root `rsbuild.config.ts` path additionally depends on `@rsbuild/core`,
`@rsbuild/plugin-react`, and `@rsbuild/plugin-node-polyfill`.

## Shared base config (`.webpack/webpack.base.js`)

`webpack.base.js` is the file most consumers extend in their own
extensions. It now requires `@rspack/core` instead of `webpack`:

```diff
- const webpack = require('webpack');
+ const webpack = require('@rspack/core');
```

Rspack exports the same `DefinePlugin`, `ProvidePlugin`, and
`IgnorePlugin` constructors under the same names, so most plugin code
is unchanged — which is why the local variable is still called `webpack`.

### Plugin replacements

| 3.12 (Webpack)                          | 3.13 (Rspack)                                                 |
|-----------------------------------------|---------------------------------------------------------------|
| `mini-css-extract-plugin`               | `require('@rspack/core').CssExtractRspackPlugin`              |
| `clean-webpack-plugin`                  | `output: { clean: true }`                                     |
| `copy-webpack-plugin`                   | `require('@rspack/core').CopyRspackPlugin`                    |
| `html-webpack-plugin`                   | `require('@rspack/core').HtmlRspackPlugin`                    |
| `@pmmmwh/react-refresh-webpack-plugin`  | `require('@rspack/plugin-react-refresh')`                     |
| `terser-webpack-plugin`                 | Built-in `SwcJsMinimizerRspackPlugin` (no config needed)      |
| `workbox-webpack-plugin` (`InjectManifest`) | Custom `InjectServiceWorkerManifestPlugin` in `webpack.pwa.js` |
| `dotenv-webpack`                        | Plain `require('dotenv').config()`                            |

`InjectServiceWorkerManifestPlugin` is a small inline plugin that
re-implements what `workbox-webpack-plugin`'s `InjectManifest` did, but
on top of Rspack's compilation hooks (`thisCompilation` →
`processAssets`, emitting a `RawSource`). It is defined locally in
`platform/app/.webpack/webpack.pwa.js` — copy it into your own
`webpack.pwa.js` derivative if you forked that file.

The React Refresh plugin is loaded defensively (`try/require`) and is
skipped when it is unavailable, in production, or during e2e coverage
runs (`COVERAGE=true`), since the refresh runtime's overlay iframe
interferes with Playwright/Cypress pointer events.

### Library output

Every package-level `webpack.prod.js` switched from the legacy library
flags to the structured `output.library` form:

```diff
  output: {
-   library: 'ohif-extension-cornerstone',
-   libraryTarget: 'umd',
+   library: {
+     name: 'ohif-extension-cornerstone',
+     type: 'umd',
+   },
    path: ROOT_DIR,
    filename: pkg.main
  }
```

If your extension uses the old flat `library` / `libraryTarget` keys,
move to the nested form — Rspack is stricter about validating this shape.

### Minifier

Terser is gone. Production builds use Rspack's built-in SWC minifier
unconditionally:

```diff
  if (isProdBuild) {
-   config.optimization.minimizer = [
-     new TerserJSPlugin({ parallel: true, terserOptions: {} }),
-   ];
+   config.optimization.minimizer = [new webpack.SwcJsMinimizerRspackPlugin()];
  }
```

No options are needed for the common case. If you previously tuned
`terserOptions`, port the equivalent settings to the SWC minimizer's
options object.

### Source maps

The devtool setting is **unchanged** from 3.12 — production builds still
emit full `source-map`, development uses `cheap-module-source-map`, and a
`QUICK_BUILD=true` build disables source maps and minification entirely
(`config.devtool = false`):

```js
devtool: isProdBuild ? 'source-map' : 'cheap-module-source-map',
// …
if (isQuickBuild) {
  config.optimization.minimize = false;
  config.devtool = false;
}
```

### Caching

```diff
- cache: {
-   type: 'filesystem',
- },
+ cache: isProdBuild ? false : { type: 'filesystem' },
```

Production builds always run from a clean cache. The development
filesystem cache is unchanged, but the cache directory is no longer
shared with Webpack — clear `.cache/` after upgrading if you see stale
output.

### `IgnorePlugin` for native modules

A new `IgnorePlugin` entry was added to skip Node-only modules pulled
in by the Cornerstone codecs:

```js
new webpack.IgnorePlugin({
  resourceRegExp: /^(fs|path)$/,
  contextRegExp: /@cornerstonejs[\\/]codec-/,
}),
```

If you removed this when forking `webpack.base.js`, add it back —
without it the prod bundle will try to require `fs` at runtime.

### Node globals (`__filename` / `__dirname`)

A new top-level `node` block tells the bundler to **leave `__filename` and
`__dirname` references un-substituted** rather than mocking them:

```js
node: {
  __filename: false,
  __dirname: false,
},
```

The Emscripten-compiled Cornerstone codecs reference `__dirname` inside
`if (ENVIRONMENT_IS_NODE)` branches that never run in the browser. Rspack's
default (a `'mock'` value) emits a warning for each such reference; setting
the values to `false` leaves them alone, which is harmless at runtime and
silences the warnings. The same `node` block is mirrored in
`rsbuild.config.ts` for the `dev:fast` path (Rsbuild's default is
`warn-mock`, with the same noisy behavior).

### Workspace package transpile

`.webpack/rules/transpileJavaScript.js` no longer treats `@ohif/*`
packages as opaque `node_modules`:

```diff
  mode === 'production'
    ? excludeNodeModulesExcept([
+       // Workspace packages (needed for pnpm shamefully-hoist where they
+       // resolve through node_modules)
+       '@ohif',
        'react-dnd',
        'dnd-core',
```

pnpm symlinks workspace packages through `node_modules`, so the
transpile rule has to opt them back in or the production bundle would
ship un-transpiled TypeScript. Custom monorepos that vendor extensions
under a different scope should add their own scope here.

### Module resolution for pnpm

Two resolution changes were needed for pnpm's isolated (non-hoisted)
`node_modules` layout. Both live in `resolve` in `webpack.base.js` (and
`webpack.pwa.js`):

- `resolve.modules` now **leads with a bare `'node_modules'`** before the
  absolute paths. This preserves the default importer-relative walk-up so
  transitive deps (e.g. `react-remove-scroll` → `tslib`) resolve to the
  sibling copy inside `.pnpm/<pkg>/node_modules` rather than an older
  hoisted one.

  ```diff
    modules: [
  +   'node_modules',
      path.resolve(__dirname, '../node_modules'),
      path.resolve(__dirname, '../../../node_modules'),
      // …
    ],
  ```

- A new `'@ohif/app$'` alias maps the bare specifier to the app source.
  A couple of extensions import app-level utilities from `@ohif/app`;
  pnpm's isolated layout does not expose the top-level app package to
  them, and adding it as a workspace dependency would create an
  `app ↔ default` cycle, so the alias resolves it directly (the `$`
  makes it an exact match, so deep subpath imports still resolve normally):

  ```js
  '@ohif/app$': path.resolve(__dirname, '../platform/app/src/index.js'),
  ```

### Plugin resolution from source (`writePluginImportsFile.js`)

Under yarn the app depended on every extension/mode and copied their
`public/` and `dist/` assets out of `node_modules`. Under pnpm + Rspack,
extensions and modes are **not** dependencies of `platform/app`; instead
`writePluginImportsFile.js` resolves the source directory of each plugin
**declared in `pluginConfig.json`**. It scans the `extensions/` and `modes/`
workspaces only to map the *declared* package names to their directories —
packages present in those workspaces but not listed in `pluginConfig.json`
are ignored. The resulting map is exposed two ways:

- `getPluginResolveAliases()` returns a `resolve.alias` map (one exact-match
  `"<pkg>$"` entry per plugin in `pluginConfig.json`) that `webpack.pwa.js`
  merges into `resolve.alias`, so the generated `pluginImports.js`
  `import()`s link to the plugin source without the plugin being a
  dependency.
- `createCopyPluginToDist(...)` copies each plugin's `public/` and `dist/`
  assets from that same source directory (falling back to `node_modules`
  for third-party entries such as `dicom-microscopy-viewer`).

A plugin can be included three ways, all declared as an entry in
`pluginConfig.json`:

1. **In-tree workspace** — a package under `extensions/` or `modes/`. Declare
   it by `packageName`; its source directory is found by the workspace scan.
2. **External, out-of-tree source** — a checkout that lives outside this repo
   (e.g. an extension generated by the OHIF CLI). Add a `directory` field to
   the entry. The path may be absolute, `~`-relative to the home directory, or
   `.`-relative to the repo root; `workspacePluginDir()` uses it directly and
   skips the workspace scan.
3. **Installed dependency** — add the package to the **root `package.json`** as
   a normal dependency and declare it by `packageName` (no `directory`). It then
   resolves from `node_modules` like any other installed package: the bare
   specifier flows through webpack's normal module walk-up (no alias is
   generated), and `pluginAssetDir()` copies its `public/`/`dist/` assets from
   `node_modules`. This is the path used for third-party packages such as
   `dicom-microscopy-viewer`.

If you maintain a fork that injects extensions a different way, this is the
seam to update.

## Per-package webpack.prod.js

For every workspace package that previously had a `webpack.prod.js`,
update the top of the file:

```diff
- const webpack = require('webpack');
+ const webpack = require('@rspack/core');
  const { merge } = require('webpack-merge');
- const MiniCssExtractPlugin = require('mini-css-extract-plugin');
+ const MiniCssExtractPlugin = webpack.CssExtractRspackPlugin;
```

and replace the flat library options with the nested form shown above.
The rest of the file (`merge(...)`, `entry`, `externals`, `output.path`,
`output.filename`) is unchanged.

## Custom extensions

If you maintain an out-of-tree OHIF extension that uses the OHIF
template, do the following:

1. Add `@rspack/cli`, `@rspack/core`, `@rspack/dev-server`, and
   `@rspack/plugin-react-refresh` to `devDependencies` (`^2.0.0`), and
   remove `webpack`, `webpack-dev-server`, and the webpack-specific plugins
   (`mini-css-extract-plugin`, `copy-webpack-plugin`, `html-webpack-plugin`,
   `clean-webpack-plugin`, `terser-webpack-plugin`,
   `@pmmmwh/react-refresh-webpack-plugin`, `workbox-webpack-plugin`,
   `dotenv-webpack`).
2. Replace `require('webpack')` with `require('@rspack/core')` in your
   `.webpack/*.js` files (you can keep the local variable named `webpack`).
3. Update plugin imports as shown in the table above, and switch the flat
   `library`/`libraryTarget` keys to the nested `output.library` form.
4. Change your build script from `webpack` to `rspack build` (and
   `webpack serve` to `rspack serve`).
5. If you re-export the OHIF base config, re-pull it after upgrading —
   the `IgnorePlugin`, `node` block, `transpileJavaScript`, and pnpm
   resolution changes only land when you re-merge.

## Known migration notes

- **`@million/lint`** integration is removed from `webpack.pwa.js`
  (it was already commented out in 3.12).
- **`Dotenv` plugin** is replaced by a top-level `dotenv.config()`
  call. If you relied on the plugin's `safe: true` behavior, move
  that check into your config loader.
- **Dev server proxy** moved from the object-keyed shape to the
  array-of-`{ context, target }` shape that `@rspack/dev-server`
  expects:

  ```diff
  - proxy: [{ '/dicomweb': 'http://localhost:5000' }],
  + proxy: [{ context: ['/dicomweb'], target: 'http://localhost:5000' }],
  ```

- **Dev-server overlay** is disabled when `COVERAGE=true` (the overlay
  iframe intercepts pointer events and breaks Playwright/Cypress clicks);
  it is kept on for normal local dev.
- The `dev:no:cache` script is now identical to `dev` — keep it as an
  alias if external scripts call it, or delete it.
</content>
</invoke>
