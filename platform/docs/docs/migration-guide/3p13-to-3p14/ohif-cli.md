---
sidebar_position: 3
sidebar_label: OHIF CLI
title: OHIF CLI deprecated
---

# OHIF CLI deprecated

`ohif-cli` is deprecated as of 3.14 and will be removed in the following
release. Running any command now prints a deprecation notice.

## Creating extensions and modes

Instead of `create-extension` / `create-mode`, point an AI coding agent at an
existing package in `extensions/` or `modes/` and have it generate the new one.
The in-repo packages track the current APIs; the templates bundled with the CLI
are a snapshot and drift out of date between releases, which is the main reason
the CLI is going away.

## `link-extension` and `link-mode` no longer affect the default build

This is the change most likely to bite mid-upgrade, because nothing fails.

`link-extension` and `link-mode` do two things: run `pnpm link`, and write a
`resolve.modules` entry into `platform/app/.webpack/webpack.pwa.js` so the
linked package's own `node_modules` are searched. That file is read only by the
legacy rspack pipeline:

| Command | Reads `webpack.pwa.js` |
| --- | --- |
| `pnpm run dev` (and `dev:orthanc`, `dev:dcm4chee`, `dev:static`) | yes |
| `pnpm run build:legacy` | yes |
| the Playwright e2e web server | yes |
| `pnpm run build` — **the default production build** | no |
| `pnpm run dev:fast` | no |

In 3.14 the default `pnpm run build` moves to `rsbuild.config.ts`, which builds
`resolve.modules` from `.webpack/resolveConfig.js` and never reads
`webpack.pwa.js`. The CLI's patch still succeeds, so there is no error — the
entry simply is not present in the build that runs.

This only matters if the linked package resolves dependencies out of its own
`node_modules` rather than the workspace root. If it does, either:

- build with `pnpm run build:legacy` until the CLI is removed, or
- add the path to the shared `moduleSearchPaths` in
  `.webpack/resolveConfig.js`, which both pipelines read.

## Adding and removing without the CLI

`add-extension`, `remove-extension`, `add-mode`, and `remove-mode` edit
`platform/app/pluginConfig.json` and the package dependencies. Both are
hand-editable — see
[pluginConfig.json](../../platform/extensions/pluginConfig.md).
