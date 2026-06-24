const path = require('path');

// Shared module-resolution rules (alias + module search paths) used by BOTH
// build pipelines so they cannot drift apart:
//   - the webpack/rspack build: webpack.base.js -> webpack.pwa.js, plus every
//     per-package webpack.prod.js / webpack.dev.js that merges webpack.base.js
//   - the rsbuild build: rsbuild.config.ts (dev:fast)
//
// Plugin aliases (writePluginImportsFile.getPluginResolveAliases) are NOT
// included here: they depend on pluginConfig.json and are merged in separately
// by each config.
//
// All paths are anchored to this file's location (the repo-root `.webpack/`
// directory), so the values are identical regardless of which package's build
// is doing the resolving.

const alias = {
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
// behavior in webpack.base.js). Pass nothing to get just the shared paths.
function getModules(srcDir) {
  return srcDir ? [...moduleSearchPaths, srcDir] : [...moduleSearchPaths];
}

module.exports = { alias, moduleSearchPaths, getModules };
