// .rspack/pluginExternals.js
//
// Contract v1: the single source of truth for what an OHIF plugin bundle must
// NOT bundle. Imported by every per-package .rspack/rspack.prod.js.
// The bare-specifier string entries ('react', 'react-dom', 'react/jsx-runtime')
// are matched exactly; under UMD they resolve to root[<full package name>], so
// platform/app/src/runtimeShared.ts (shared-deps workstream) must assign a
// window global for every string entry AND for the packages matched by the
// /^@ohif/ and /^@cornerstonejs/ regexes that the host provides as singletons.
// A unit test in that workstream asserts the two lists stay in sync.
module.exports = [
  /\b(vtk.js)/,
  /\b(dcmjs)/,
  /\b(gl-matrix)/,
  /^@ohif/,
  /^@cornerstonejs/,
  'react',
  'react-dom',
  'react/jsx-runtime',
];

// v1 host-globals sharing contract: the packages platform/app/src/runtimeShared.ts
// assigns to window, keyed by full package name. Exported here so the parity
// test (platform/app/src/runtimeShared.test.js) compares both sides from one
// require(), and so scripts/verify-tarballs.mjs derives the published @ohif
// SDK set from the same list (B6 machine-checked invariant).
// @ohif/i18n is shared (GAP-1): runtime extensions dereference it during
// module evaluation. @ohif/ui is intentionally absent — it is legacy and a
// forbidden import for runtime plugins.
// Regex externals above (/^@ohif/, /^@cornerstonejs/, vtk.js) intentionally
// match MORE than this list; vtk.js is externalized with no host global — a
// known v1 gap.
const hostSharedPackages = [
  'react',
  'react-dom',
  'react/jsx-runtime',
  '@ohif/core',
  '@ohif/ui-next',
  '@ohif/i18n',
  '@ohif/extension-default',
  '@ohif/extension-cornerstone',
  '@cornerstonejs/core',
  '@cornerstonejs/tools',
  'dcmjs',
  'gl-matrix',
];
module.exports.hostSharedPackages = hostSharedPackages;
