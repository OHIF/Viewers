---
sidebar_position: 3.2
sidebar_label: Publish an Extension or Mode
title: Publish an Extension or Mode
summary: Package and publish an OHIF extension or mode to npm — the package.json shape create-ohif produces, the pnpm-only publishConfig rewrite, dist-tags, changesets, and tarball verification.
---

# Publish an Extension or Mode

Publishing an extension or mode lets other teams install it from npm and load
it either at build time (declared in `pluginConfig.json`) or at runtime (a
descriptor in `app-config.js`). A package scaffolded with
[`pnpm create ohif@beta`](./create-ohif.md) is already publish-ready; this page
explains the shape it produces and the one publishing rule you must not miss.

## package.json requirements

```jsonc title="package.json"
{
  "name": "@acme/extension-foo",
  "keywords": ["ohif-extension"],        // "ohif-mode" for a mode
  "peerDependencies": {
    "@ohif/core": ">=3.13.0-beta.0 <4"   // plus react / react-dom for extensions
  },
  "main": "dist/index.umd.js",
  "module": "src/index.tsx",             // working tree points at the src entry
  "files": ["dist", "src", "public", "README.md"],
  "publishConfig": {                     // pnpm rewrites these into the tarball
    "access": "public",
    "main": "dist/index.umd.js",
    "module": "dist/index.umd.js"
  }
}
```

The working-tree `module` points at `src/*` so directory-mode (out-of-tree)
consumers can source-compile the package. `publishConfig` overrides `main` and
`module` to the built `dist/index.umd.js` so the tarball ships the UMD bundle.

:::note
There is no `types` field and no `exports` map in the v1 contract — the build
emits a UMD bundle, not TypeScript declarations. Do not add a `types` entry
pointing at a `.d.ts` file the toolchain does not produce.
:::

`files` ships both `dist/` and `src/` (plus `public/` for extensions): `dist/`
is the published bundle, and `src/` keeps the package usable as a directory-mode
dependency.

## Build

```bash
pnpm run build
```

This runs `rspack build --config .rspack/rspack.prod.js` and emits
`dist/index.umd.js` (extensions also emit `dist/index.css`). The build config
sets `output.library = { name: pkg.name, type: 'umd', export: 'default' }`, so
the UMD global is `window['@acme/extension-foo']` and it resolves to the
extension object itself (no `.default` indirection).

Host-provided packages must stay **externals** — React (`react`, `react-dom`,
`react/jsx-runtime`), `@ohif/*`, `@cornerstonejs/*`, `vtk.js`, `dcmjs`, and
`gl-matrix`. The scaffolded `.rspack/pluginExternals.js` already lists them; do
not bundle them, or the plugin ships a second copy of React and fails to load.
See [Develop Out-of-Tree](./out-of-tree.md) for the shared-package rationale.

## Publish with pnpm — not npm

:::danger
The npm CLI ignores `publishConfig` field rewrites. Publishing with
`npm publish` ships a tarball whose `main`/`module` still target `src/*`, which
cannot be consumed as a prebuilt bundle. Always publish with **pnpm**.
:::

```bash
pnpm publish --access public
```

## dist-tags

Publish prereleases under the `beta` tag and reserve `latest` for stable
releases:

```bash
pnpm publish --tag beta
```

This mirrors how `create-ohif` itself is distributed — until a `latest` release
exists, consumers pin `@beta`.

## Versioning with changesets

OHIF versions its own packages in lockstep, but a third-party package versions
independently. [`@changesets/cli`](https://github.com/changesets/changesets) is
the recommended tool in your own repo:

```bash
pnpm add -D @changesets/cli
pnpm changeset init
```

## Verify the tarball

Before publishing, inspect what will actually ship:

```bash
pnpm pack
```

Confirm that the `package.json` inside the tarball has `main` and `module`
pointing at `dist/index.umd.js` (the `publishConfig` rewrite applied), and that
`dist/`, `src/`, and `public/` are all present.

Then check the three things that most often break a published plugin:

- **No `workspace:` versions.** Inside a monorepo, dependencies on sibling
  packages are written `workspace:*`. `pnpm pack` and `pnpm publish` replace them
  with real versions; npm does not. A tarball whose `package.json` still contains
  `workspace:` cannot be installed.
- **The bundle exists.** `dist/index.umd.js` must be in the tarball. If it is
  missing, the build did not run before packing.
- **No copy of React inside the bundle.** React must come from the host page
  (see the externals list above). A bundle that carries its own React loads, but
  breaks hooks and context as soon as it renders next to the viewer's React. This
  search should print `0`:

  ```bash
  tar -xOzf acme-extension-foo-1.0.0.tgz package/dist/index.umd.js \
    | grep -c "__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE ="
  ```

  The string only exists inside React's own code. The small
  `react/compiler-runtime` helper the React Compiler adds to compiled components
  does not contain it, and is fine to bundle: it reads from the host's React.

### How OHIF checks its own published packages

The OHIF monorepo runs the same checks, and more, on its own published packages
with `scripts/verify-tarballs.mjs` (`pnpm run verify:tarballs`, after building
the packages). CI runs it on every pull request and again just before each npm
release, and any failure stops the release. It:

- Allows only the published SDK packages to be published (`@ohif/core`,
  `@ohif/ui-next`, `@ohif/i18n`, `@ohif/extension-default`,
  `@ohif/extension-cornerstone`, plus the `create-ohif` tool); every other
  workspace package must be `private: true`. It also checks that the release
  script's publish list matches.
- Packs each SDK package and checks that its entry points exist in the tarball,
  `workspace:` versions were replaced, the `publishConfig` rewrites were applied,
  the UMD bundle is present, and no SDK package declares the legacy `@ohif/ui` as
  a peer.
- Checks that no bundle contains a copy of React or react-dom, both through the
  bundle's source map and by searching the bundle text, allowing only the
  `react/compiler-runtime` helper.

Published OHIF tarballs ship without source maps, because the release build skips
them. The source-map part of the React check therefore runs only in the pull
request build; at release time the bundle-text search covers it.

## Discovery

Registry discovery keys off the `ohif-extension` / `ohif-mode` keyword:

```bash
npm search keywords:ohif-extension
```

Keywords are a discovery signal, not a trust signal — installing a package
still means running its code, so vet third-party plugins as you would any
dependency.
