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

## `.npmrc`

A new `.npmrc` at the repository root controls install behavior:

```ini
frozen-lockfile=true
```

CI installs error out if the lockfile would change. To update the lockfile
locally, use `pnpm install --no-frozen-lockfile` (also exposed as the
`install:update-lockfile` script).

## `pnpm-workspace.yaml`

Workspace membership moved out of `package.json` into a dedicated file:

```yaml
packages:
  - platform/*
  - extensions/*
  - modes/*
shamefullyHoist: true
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

- **`shamefullyHoist: true`** keeps the install layout flat, the way yarn
  v1 produced it. This is required because some OHIF dependencies expect
  to resolve transitive packages directly from `node_modules`.
- **`allowBuilds`** is pnpm's allow-list for packages whose install scripts
  are allowed to run. If you add a dependency that ships a postinstall
  script (native bindings, optimized binaries, etc.) you must add it here
  or pnpm will skip the build.

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
+   "pnpm": ">=10"
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
