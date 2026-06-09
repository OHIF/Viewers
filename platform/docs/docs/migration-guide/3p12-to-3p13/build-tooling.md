---
sidebar_position: 4
sidebar_label: Build Tooling (Rspack)
title: Webpack to Rspack v2
summary: 3.13 swaps Webpack for Rspack v2 across the monorepo. This guide covers the new build commands, plugin replacements, and how to update custom extensions that ship their own webpack config.
---

# Webpack to Rspack v2

OHIF 3.13 replaces Webpack with [Rspack](https://rspack.dev) v2 as the
default bundler for the app, every extension, every mode, and the
`@ohif/ui-next` / `@ohif/ui` / `@ohif/i18n` / `@ohif/core` packages. The
existing `.webpack/` directory layout and `webpack.config.js`-style
entry points are kept; only the plugin imports and runner commands
change.

A `build:webpack` fallback script remains in `platform/app/package.json`
for the rare case where you need to run the classic Webpack pipeline
during the transition.

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
+ "build:webpack": "cross-env NODE_OPTIONS=--max-old-space-size=16384 webpack --progress --config .webpack/webpack.pwa.js",
- "dev": "cross-env NODE_ENV=development webpack serve --config .webpack/webpack.pwa.js",
+ "dev": "cross-env NODE_ENV=development rspack serve --config .webpack/webpack.pwa.js",
- "dev:orthanc": "… webpack serve --config .webpack/webpack.pwa.js",
+ "dev:orthanc": "… rspack serve --config .webpack/webpack.pwa.js"
```

Notes:

- The build now requests `--max-old-space-size=24576` (24 GB). The
  previous 8 GB limit is no longer enough for full prod builds.
- `webpack serve` is replaced by `rspack serve`. The `--no-cache` flag
  is dropped from `dev:no:cache` — production build caching is disabled
  unconditionally (see "Caching" below).
- A new `build:webpack` script keeps the original Webpack invocation
  available if you need a side-by-side comparison.

## New dependencies

`platform/app/package.json` adds:

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

The same four packages were added to every other workspace package that
ships a `.webpack/webpack.prod.js` (extensions, modes, `ui`, `ui-next`,
`core`, `i18n`).

Webpack itself is retained as a dev dependency (`webpack@5.105.0`,
`webpack-cli@5.1.4`) to keep the `build:webpack` fallback usable.

## Shared base config (`.webpack/webpack.base.js`)

`webpack.base.js` is the file most consumers extend in their own
extensions. It now requires `@rspack/core` instead of `webpack`:

```diff
- const webpack = require('webpack');
+ const webpack = require('@rspack/core');
```

Rspack exports the same `DefinePlugin`, `ProvidePlugin`, and
`IgnorePlugin` constructors under the same names, so most plugin code
is unchanged.

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

`InjectServiceWorkerManifestPlugin` is a small inline plugin that
re-implements what `workbox-webpack-plugin`'s `InjectManifest` did, but
on top of Rspack's compilation hooks. It is defined locally in
`platform/app/.webpack/webpack.pwa.js` — copy it into your own
`webpack.pwa.js` derivative if you forked that file. `dotenv-webpack`
has also been replaced with a plain `require('dotenv').config()` call.

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
you must move to the nested form — Rspack is stricter about validating
this shape.

### Devtool / source maps

Production source maps are now `hidden-source-map` (previously
`source-map`). The files are still generated for upload to error
trackers, but no `//# sourceMappingURL=` comment is emitted in the
bundles served to browsers.

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

### Minifier

```js
config.optimization.minimizer = TerserJSPlugin
  ? [new TerserJSPlugin({ parallel: true, terserOptions: {} })]
  : [new webpack.SwcJsMinimizerRspackPlugin()];
```

When the build runs through Rspack, `terser-webpack-plugin` is `null`
and the SWC minifier is used automatically. The legacy webpack
fallback still uses Terser.

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

### Workspace package transpile

`webpack/rules/transpileJavaScript.js` no longer treats `@ohif/*`
packages as `node_modules`:

```diff
  mode === 'production'
    ? excludeNodeModulesExcept([
+       '@ohif',
        'react-dnd',
        'dnd-core',
```

pnpm symlinks workspace packages through `node_modules`, so the
transpile rule has to opt them back in or the production bundle would
ship un-transpiled TypeScript. Custom monorepos that vendor extensions
under a different scope should add their own scope here.

### Symlink resolution

`resolve.symlinks` stays at `true` (it was already the default in 3.12),
but the comment was updated to spell out the pnpm constraint: workspace
packages keep relative imports to their own siblings, so resolving
through the symlink would break those imports.

### Node polyfills

A new top-level `node` block exposes `__filename` / `__dirname` as
strings:

```js
node: {
  __filename: 'mock',
  __dirname: 'mock',
}
```

Some Cornerstone dependencies (`gl-matrix`, the OpenJPEG codec) read
those globals at module-eval time. Rspack does not polyfill them by
default the way Webpack v4 did.

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
   `@rspack/plugin-react-refresh` to `devDependencies` (`^2.0.0`).
2. Replace `webpack` with `@rspack/core` in your `.webpack/*.js` files.
3. Update plugin imports as shown in the table above.
4. Change your build script from `webpack` to `rspack build` (and
   `webpack serve` to `rspack serve`).
5. If you re-export the OHIF base config, re-pull it after upgrading —
   the IgnorePlugin and `transpileJavaScript` rule changes only land
   when you re-merge.

## Known migration notes

- **`@million/lint`** integration is removed from `webpack.pwa.js`
  (it was already commented out in 3.12).
- **`Dotenv` plugin** is replaced by a top-level `dotenv.config()`
  call. If you relied on the plugin's `safe: true` behavior, move
  that check into your config loader.
- **`hidden-source-map`** means browser DevTools will not auto-load
  the source maps in production. Configure your error tracker to
  upload them or switch the devtool back to `source-map` in a fork.
- The dev server's `--no-cache` flag is gone (Rspack does not expose
  it). The `dev:no:cache` script is now identical to `dev` — keep it
  as an alias if external scripts call it, or delete it.
