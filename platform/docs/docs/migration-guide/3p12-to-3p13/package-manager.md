---
sidebar_position: 3
sidebar_label: Package Manager (pnpm)
title: Yarn / Lerna to pnpm
summary: 3.13 moves the monorepo from yarn + lerna to pnpm workspaces. This guide covers the new install/run commands, workspace dependency syntax, and changes to CLI-generated extensions and modes.
---

# Yarn + Lerna to pnpm

OHIF 3.13 replaces the `yarn` + `lerna` toolchain with **pnpm workspaces**.
The repository now uses a single `pnpm-lock.yaml` and a `pnpm-workspace.yaml`
manifest at the root. `yarn.lock`, `lerna.json`, `nx.json`, `bun.lock`,
the `addOns/` directory, and `preinstall.js` have all been removed.

## Required tools

| Tool | Old minimum   | New minimum |
|------|---------------|-------------|
| node | `>=18`        | `>=24`      |
| pnpm | _(unused)_    | `>=11`      |
| yarn | `>=1.20.0`    | _(removed)_ |
| npm  | `>=6`         | _(removed)_ |

The root `package.json` declares `"packageManager": "pnpm@11.1.1"`. If you use
[Corepack](https://nodejs.org/api/corepack.html), running any pnpm command in
the repo will pick the correct version automatically:

```bash
corepack enable
corepack prepare pnpm@11.1.1 --activate
```

## Install and run commands

Replace your existing yarn and lerna commands with their pnpm equivalents.

| 3.12 (yarn / lerna)                       | 3.13 (pnpm)                                 |
|-------------------------------------------|---------------------------------------------|
| `yarn install --frozen-lockfile`          | `pnpm install --frozen-lockfile`            |
| `yarn install`                            | `pnpm install`                              |
| `yarn run dev`                            | `pnpm run dev`                              |
| `yarn run build`                          | `pnpm run build`                            |
| `yarn run test:unit`                      | `pnpm run test:unit`                        |
| `lerna run build --stream`                | `pnpm -r run build`                         |
| `lerna run dev:viewer --stream`           | `pnpm --filter @ohif/app run dev:viewer`    |
| `lerna run clean --stream`                | `pnpm -r run clean`                         |

The root `scripts` section was rewritten to use `pnpm --filter @ohif/app run …`
for app-targeted scripts and `pnpm -r run …` for monorepo-wide scripts.
There is no `preinstall` script anymore.

## `.npmrc` and the frozen-lockfile default

A new `.npmrc` at the repository root controls linking behavior (hoisted
`node_modules`, workspace package linking, no strict peer checks). The
frozen-lockfile default lives in `pnpm-workspace.yaml`, not in `.npmrc`:

```yaml
frozenLockfile: true
```

With that setting, every plain `pnpm install` in the repo is frozen: it installs
exactly what `pnpm-lock.yaml` records, transitive versions and integrity hashes
included, and errors out if the lockfile would change. CI and the Docker image
builds rely on this; `--no-frozen-lockfile` on the command line overrides it, so
never use it in a build or CI path. To update the lockfile locally after editing
a `package.json`, run `pnpm run install:update-lockfile` (which is
`pnpm install --no-frozen-lockfile`) and commit the result.

## `pnpm-workspace.yaml`

Workspace membership moved out of `package.json` into a dedicated file:

```yaml
packages:
  - platform/*
  - extensions/*
  - modes/*
nodeLinker: hoisted
allowBuilds:
  '@scarf/scarf': true
  '@swc/core': true
  core-js: true
  core-js-pure: true
  cypress: true
  protobufjs: true
  sharp: true
overrides:
  # pinned versions previously declared in package.json resolutions …
```

Two settings worth highlighting:

- **`nodeLinker: hoisted`** installs a plain, flat `node_modules`, the way
  npm and yarn v1 lay it out, instead of pnpm's default linked layout. This is
  required because some OHIF dependencies expect to resolve packages they never
  declared directly from `node_modules`. (It mirrors the cornerstone3D setup;
  pnpm's `shamefullyHoist` is a different, partly-flat option and is not used.)
- **`allowBuilds`** is pnpm's allow-list for packages whose install scripts
  are allowed to run. If you add a dependency that ships a postinstall
  script (native bindings, optimized binaries, etc.) you must add it here;
  current pnpm versions fail the install while any such script is left
  unapproved.

The `addOns/externals/*` workspace entry from 3.12 is **removed**. The
`dicom-microscopy-viewer` and externals devDependencies are now installed
directly through `pnpm-workspace.yaml` overrides — no separate add-on
install step is needed.

## Workspace dependency syntax

Intra-workspace dependencies now use the `workspace:*` protocol instead of
hard-pinned version strings:

```diff
  "dependencies": {
-   "@ohif/core": "3.13.0-beta.72",
-   "@ohif/extension-cornerstone": "3.13.0-beta.72",
-   "@ohif/ui-next": "3.13.0-beta.72"
+   "@ohif/core": "workspace:*",
+   "@ohif/extension-cornerstone": "workspace:*",
+   "@ohif/ui-next": "workspace:*"
  }
```

When pnpm publishes a workspace package, `workspace:*` is rewritten to the
actual version on disk, so downstream consumers continue to see normal
semver ranges in published `package.json` files.

If you keep an OHIF fork with extra extensions in `extensions/`, you do
**not** need to add them to `pnpm-workspace.yaml` — the glob pattern
already covers them. Inside your extension's `package.json`, change any
`@ohif/*` deps from hard versions to `workspace:*`.

## CLI changes

:::note
The CLI itself is removed in 3.14; see [OHIF CLI removal](../3p13-to-3p14/cli-removal.md).
:::

`platform/cli` (`@ohif/cli`) no longer wraps yarn:

- `getYarnInfo` and `uninstallNPMPackage` now shell out via `execa` to
  `npm` / `pnpm` directly rather than depending on the deprecated
  `yarn-programmatic` package.
- The CLI invokes scripts with `pnpm run …` and instructs new extension
  authors to use pnpm.
- The yarn dependency was removed from `platform/cli/package.json`.

If you previously ran extension/mode commands as `yarn run cli …`,
switch to `pnpm run cli …`.

## CLI extension and mode templates

The `extension` and `mode` templates in `platform/cli/templates/*/dependencies.json`
were updated:

```diff
  "engines": {
-   "node": ">=14",
-   "npm": ">=6",
-   "yarn": ">=1.18.0"
+   "node": ">=24",
+   "pnpm": "11.1.1"
  },
  "scripts": {
    "dev": "cross-env NODE_ENV=development webpack --config .webpack/webpack.dev.js --watch --output-pathinfo",
-   "dev:my-extension": "yarn run dev",
+   "dev:my-extension": "pnpm rundev",
    "build": "cross-env NODE_ENV=production webpack --config .webpack/webpack.prod.js",
-   "build:package": "yarn run build",
-   "start": "yarn run dev"
+   "build:package": "pnpm runbuild",
+   "start": "pnpm rundev"
  }
```

> **Heads up**: the template's `pnpm rundev` / `pnpm runbuild` strings are
> missing the space between `run` and the script name. If you generate a
> new extension from the CLI, replace those with `pnpm run dev` and
> `pnpm run build`.

## Audit and lockfile maintenance

- `yarn audit` and the `bun audit` ignore list have been replaced with a
  plain `pnpm audit` in the root script.
- `yarn dlx`-style ad-hoc commands should use `pnpm dlx` instead.
- Update CI cache keys: cache `~/.local/share/pnpm/store` (or the path
  reported by `pnpm store path`) keyed on `pnpm-lock.yaml`. Yarn cache
  paths are no longer populated.

## Quick migration checklist

1. Install Node 24 and pnpm 11 (or use Corepack).
2. Delete `node_modules` and any `yarn.lock`/`addOns/yarn.lock` from your
   fork.
3. Replace hard-pinned `@ohif/*` deps with `workspace:*` in your
   workspace packages.
4. Update CI scripts to call `pnpm install --frozen-lockfile` and
   `pnpm run …`.
5. Update your cache key to `pnpm-lock.yaml`.
6. Regenerate any extensions you created from the CLI templates and fix
   the `pnpm rundev` / `pnpm runbuild` script names.
