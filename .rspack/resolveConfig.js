const path = require('path');

// Shared module-resolution rules (alias + module search paths) used by BOTH
// build pipelines so they cannot drift apart:
//   - the webpack/rspack build: rspack.base.js -> rspack.pwa.js, plus every
//     per-package rspack.prod.js / rspack.dev.js that merges rspack.base.js
//   - the rsbuild build: rsbuild.config.ts (dev:fast)
//
// Plugin aliases (writePluginImportsFile.getPluginResolveAliases) are NOT
// included here: they depend on pluginConfig.json and are merged in separately
// by each config.
//
// All paths are anchored to this file's location (the repo-root `.rspack/`
// directory), so the values are identical regardless of which package's build
// is doing the resolving.

const REPO_ROOT = path.resolve(__dirname, '..');

// Singleton (dedupe) aliases: force every compiled module — including
// out-of-tree `directory` plugins that may carry their own node_modules —
// to resolve these packages to the host's single copy. Trailing `$` = exact
// match on the bare specifier, so subpath imports (e.g. @ohif/ui-next/lib/x)
// still resolve through normal walk-up and honor each package's `exports`.
//
// react / react-dom / @cornerstonejs/*: real directories in the repo-root
// node_modules (pnpm node-linker=hoisted, see .npmrc). A cs3d:link'ed local
// build replaces these with symlinks; resolve.symlinks:true follows them.
//
// @ohif/core / @ohif/ui-next intentionally point at the WORKSPACE SOURCE
// packages, NOT node_modules: the hoisted linker never places workspace
// packages in the root node_modules (they are symlinked per-consumer), and
// the source dir keeps module:"src/index.ts" dev-mode resolution working.
//
// Known residual (do NOT expand this settled list): the exact-match
// `react-dom$` does not cover `react-dom/client` subpath imports, so a
// plugin-local react-dom copy imported via subpath can still duplicate —
// mitigated by the plugin template's `.npmrc auto-install-peers=false` and
// the plugin doctor's local-singleton warning.
const dedupeAlias = {
  'react$': path.join(REPO_ROOT, 'node_modules', 'react'),
  'react-dom$': path.join(REPO_ROOT, 'node_modules', 'react-dom'),
  'react/jsx-runtime$': path.join(REPO_ROOT, 'node_modules', 'react', 'jsx-runtime.js'),
  '@ohif/core$': path.join(REPO_ROOT, 'platform', 'core'),
  '@ohif/ui-next$': path.join(REPO_ROOT, 'platform', 'ui-next'),
  '@cornerstonejs/core$': path.join(REPO_ROOT, 'node_modules', '@cornerstonejs', 'core'),
  '@cornerstonejs/tools$': path.join(REPO_ROOT, 'node_modules', '@cornerstonejs', 'tools'),
};

const alias = {
  ...dedupeAlias,
  // Some extensions import app-level utilities (e.g. history,
  // preserveQueryParameters) from '@ohif/app'. pnpm's isolated layout does not
  // expose the top-level app package to those extensions, and adding it as a
  // workspace dependency would create an app<->default cycle, so we resolve the
  // bare specifier to the app source here ($ = exact match).
  '@ohif/app$': path.resolve(__dirname, '../platform/app/src/index.js'),
  '@': path.resolve(__dirname, '../platform/app/src'),
  '@components': path.resolve(__dirname, '../platform/app/src/components'),
  '@hooks': path.resolve(__dirname, '../platform/app/src/hooks'),
  '@routes': path.resolve(__dirname, '../platform/app/src/routes'),
  '@state': path.resolve(__dirname, '../platform/app/src/state'),
};

// Directories to search when resolving modules. The leading bare 'node_modules'
// preserves the default importer-relative walk-up, which pnpm's isolated layout
// requires so that transitive deps (e.g. react-remove-scroll -> tslib 2.x)
// resolve to the sibling copy inside .pnpm/<pkg>/node_modules rather than a
// hoisted older version.
const moduleSearchPaths = [
  'node_modules',
  path.resolve(__dirname, '../node_modules'),
  path.resolve(__dirname, '../../../node_modules'),
  path.resolve(__dirname, '../platform/app/node_modules'),
  path.resolve(__dirname, '../platform/ui/node_modules'),
];

// Build the resolve.modules array for a build. `srcDir` is the building
// package's source root; it is appended last (matching the previous inline
// behavior in rspack.base.js). Pass nothing to get just the shared paths.
function getModules(srcDir) {
  return srcDir ? [...moduleSearchPaths, srcDir] : [...moduleSearchPaths];
}

module.exports = { alias, dedupeAlias, moduleSearchPaths, getModules };
