---
sidebar_position: 5
sidebar_label: Node Version
title: Node.js 24 Requirement
summary: 3.13 raises the minimum Node.js version from 18 to 24. This guide covers the affected engines fields, CI runners, and how the bump interacts with the pnpm and Rspack upgrades.
---

# Node.js 24

OHIF 3.13 bumps the minimum supported Node.js runtime from 18 to **24**.
The `.node-version` file at the repository root and every workspace
package's `engines.node` field have been updated.

```diff
- .node-version  20.9.0
+ .node-version  24
```

```diff
  "engines": {
-   "node": ">=18",
-   "npm": ">=6",
-   "yarn": ">=1.20.0"
+   "node": ">=24",
+   "pnpm": "11.1.1"
  }
```

The `npm` and `yarn` engines fields are removed because the repository
no longer supports either as the install path — see the
[Package Manager guide](./package-manager.md).

## Why Node 24

- Rspack v2 requires a modern V8 build (Node 24 ships V8 12.x), which
  is needed for the SWC-based minifier to work without falling back to
  Babel transforms.
- pnpm 11's `shamefullyHoist` + workspace symlink layout depends on
  Node 20.10+ `fs.symlink` semantics; Node 24 is the current LTS line
  and is what CI is pinned to.
- The Cornerstone3D codecs use top-level `await` and the modern
  `Uint8Array`/`Buffer` interop introduced in Node 22+.
- The 24 GB `--max-old-space-size` setting in the prod build script
  benefits from Node 24's improved large-heap GC.

## Affected files

Updated in this release:

- `.node-version` — pinned to `24`.
- `package.json` (root) — `engines.node >=24`, `engines.pnpm 11.1.1`.
- Every workspace package's `engines.node` field, including
  `platform/app`, `platform/core`, `platform/ui`, `platform/ui-next`,
  `platform/i18n`, `platform/cli`, every `extensions/*` package, and
  every `modes/*` package.
- `platform/cli/templates/extension/dependencies.json` and
  `platform/cli/templates/mode/dependencies.json` — extensions and
  modes generated from the CLI now require Node 24 and pnpm 11.1.1.
- CI config (`.github/workflows/*`, `.circleci/config.yml`,
  `.netlify/build-deploy-preview.sh`) was bumped in lockstep.

## Local environments

If you use a Node version manager:

```bash
# nvm
nvm install 24
nvm use 24

# fnm
fnm install 24
fnm use 24

# volta
volta install node@24
```

`.node-version` is honored by `fnm`, `nodenv`, `asdf`, and (with the
`engines-strict` setting) `pnpm`. Most editors with a Node toolbar
will switch automatically when you cd into the repo.

## CI runners

Update your pipeline images:

```diff
- node-version: '20.9.0'
+ node-version: '24'
```

GitHub Actions: `actions/setup-node@v4` with `node-version: '24'`.
CircleCI: `cimg/node:24.0` (or newer).
Docker base image: `node:24-alpine` for production builds. The
project's `Dockerfile` was updated to match.

## Behavior changes worth knowing

- **`punycode`**: Node 24 prints a deprecation warning when the
  built-in `punycode` is required. Some transitive dependencies still
  do this; the warning is harmless but noisy. Set
  `NODE_OPTIONS=--no-deprecation` if you need to silence it in CI.
- **OpenSSL provider**: Node 24 uses OpenSSL 3.x. If you previously
  set `NODE_OPTIONS=--openssl-legacy-provider` for old Webpack hashes,
  remove it — Rspack does not need it.
- **`fetch` is global**: Node 24 has the WHATWG `fetch` built in.
  Polyfills like `node-fetch` are no longer needed in scripts that
  run under Node.
- **ESM resolution is stricter**: relative imports in `.js` files
  inside `"type": "module"` packages must include the file extension.
  This mainly affects test helpers under `tests/utils/`.

## Compatibility window

If you cannot move to Node 24 yet, the `build:webpack` fallback in
`platform/app/package.json` runs under Node 22, but production
support is not guaranteed and the Rspack scripts will refuse to run.
We recommend planning the runtime upgrade alongside the 3.13
deployment.
