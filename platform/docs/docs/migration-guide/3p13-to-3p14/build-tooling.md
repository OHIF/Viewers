---
sidebar_position: 12
sidebar_label: Build Tooling (.rspack, Rsbuild)
title: Build tooling - .rspack configs and a single Rsbuild app pipeline
summary: 3.14 renames the .webpack config directories to .rspack, moves the app's production build and every dev server onto one Rsbuild config, removes webpack.pwa.js and rspack serve, and changes the dev scripts. Covers what forks and contributors need to update.
---

# Build tooling: `.rspack` configs and a single Rsbuild app pipeline

3.13 replaced Webpack with Rspack but kept the old file names (see
[Webpack to Rspack v2](../3p12-to-3p13/build-tooling.md)). 3.14 finishes that
move: the config files are renamed to match the bundler, and the app builds and
serves through one Rsbuild config instead of two separate pipelines.

You are affected if you maintain a fork, build the viewer yourself, or work on
OHIF itself. Deployments of the published `ohif/app` image and plugin authors
using `pnpm create ohif@beta` are not affected.

## `.webpack/` is now `.rspack/`

The config directories and files were renamed:

| 3.13 | 3.14 |
| --- | --- |
| `.webpack/webpack.base.js` | `.rspack/rspack.base.js` |
| `<package>/.webpack/webpack.prod.js` | `<package>/.rspack/rspack.prod.js` |
| `<package>/.webpack/webpack.dev.js` | `<package>/.rspack/rspack.dev.js` |
| `.webpack/resolveConfig.js`, `.webpack/rules/*` | `.rspack/resolveConfig.js`, `.rspack/rules/*` |
| `platform/app/.webpack/webpack.pwa.js` | removed (see below) |

The contents are the same Rspack configs as in 3.13. They still
`require('@rspack/core')` into a local variable named `webpack`, and the per-package
UMD builds still run the `rspack` CLI against `.rspack/rspack.base.js`. Every
per-package `rspack.prod.js` now takes its `externals` from the shared
`.rspack/pluginExternals.js` instead of a hand-written list.

**If you have a fork,** rename the same paths, and update anything that
`require`s them, such as a custom package build or a script.

## The app builds and serves through one Rsbuild config

In 3.13 the app had two pipelines: `rspack serve` against
`.webpack/webpack.pwa.js` for `dev`, and Rsbuild against `rsbuild.config.ts` for
`dev:fast` and the production build. In 3.14 there is one: the repo-root
`rsbuild.config.ts`, for the production build and every dev server.
`webpack.pwa.js` is removed, there is no `rspack.pwa.js`, and `rspack serve` is no
longer used anywhere.

What used to live in `webpack.pwa.js` is now in `rsbuild.config.ts`:

- The service-worker precache step, `InjectServiceWorkerManifestPlugin`,
  registered through `tools.rspack.plugins`.
- The dev-server proxy (`PROXY_TARGET`, `PROXY_DOMAIN` and the rewrite
  variables). Note that `PROXY_TARGET` is now the path to proxy, for example
  `/pacs/dicom-web`, rather than a full URL.
- The plugin aliases from `writePluginImportsFile.js`, merged into
  `resolve.alias`, so the generated `pluginImports.js` resolves each plugin
  declared in `pluginConfig.json` from its source directory.

**If you customized `webpack.pwa.js`,** port those changes into
`rsbuild.config.ts`. Rsbuild options cover most needs directly; anything
Rspack-specific goes under `tools.rspack`.

## Script changes

All app scripts in `platform/app/package.json` now run Rsbuild with
`--config-loader jiti`, which loads the TypeScript config the same way for every
command:

```diff
- "build": "… rsbuild build --config ../../rsbuild.config.ts",
- "build:legacy": "… rspack build --config .webpack/webpack.pwa.js",
- "dev": "cross-env NODE_ENV=development rspack serve --config .webpack/webpack.pwa.js",
- "dev:fast": "… rsbuild dev --config ../../rsbuild.config.ts",
+ "build": "… rsbuild build --config ../../rsbuild.config.ts --config-loader jiti",
+ "dev": "… NODE_ENV=development rsbuild dev --config ../../rsbuild.config.ts --config-loader jiti",
+ "dev:fast": "pnpm run dev",
+ "dev:no:cache": "pnpm run dev",
```

- `pnpm dev` is now the Rsbuild dev server. `dev:fast` and `dev:no:cache` are
  aliases of it, kept so existing habits and scripts keep working.
- `build:legacy` is removed.
- `dev:orthanc`, `dev:dcm4chee` and `dev:static` run the same Rsbuild dev server
  with their own `APP_CONFIG`.
- The dev server no longer tries to open a browser when the `CI` environment
  variable is set.

## Test data for e2e tests

The e2e app configs (`e2e`, `multiple`, `customization`) read studies from
`/viewer-testdata`. The old `rspack serve` setup mounted the `testdata` git
submodule there; the Rsbuild dev server now does the same through a small
static-file middleware in `rsbuild.config.ts`. Run `pnpm run test:data` once to
fetch the submodule, then `pnpm run test:e2e:serve` as before.

## Docker image builds

The root `Dockerfile` installs with a frozen lockfile:

```dockerfile
RUN pnpm install --frozen-lockfile --filter '!ohif-docs'
```

and `.dockerignore` now lets `platform/docs/package.json` into the build context,
because pnpm 12 refuses a frozen install when the lockfile records a workspace
package whose manifest is missing. **If you copied the root `Dockerfile` or
`.dockerignore` into a fork,** carry both changes across, and do not use
`--no-frozen-lockfile` in an image build: it lets the image pick up dependency
versions the lockfile never recorded.
