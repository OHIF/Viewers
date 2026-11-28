// .rspack/pluginExternals.js
//
// Contract v1: the single source of truth for what an OHIF plugin bundle must
// NOT bundle. Imported by every per-package .rspack/rspack.prod.js.
// The bare-specifier string entries (React, React Router, i18next and
// dcmjs) are matched exactly; under UMD they resolve to root[<full package name>], so
// platform/app/src/runtimeShared.ts (shared-deps workstream) must assign a
// window global for every string entry AND for the packages matched by the
// /^@ohif/ and /^@cornerstonejs/ regexes that the host provides as singletons.
// A unit test in that workstream asserts the two lists stay in sync.
module.exports = [
  /\b(vtk.js)/,
  'dcmjs',
  /\b(gl-matrix)/,
  /^@ohif/,
  /^@cornerstonejs/,
  'react',
  'react-dom',
  'react/jsx-runtime',
  'react-router',
  'react-router-dom',
  'i18next',
  'react-i18next',
];

// v1 host-globals sharing contract: the packages platform/app/src/runtimeShared.ts
// assigns to window, keyed by full package name. Exported here so the parity
// test (platform/app/src/runtimeShared.test.js) compares both sides from one
// require().
// @ohif/i18n is shared because runtime extensions dereference it during
// module evaluation. @ohif/ui is intentionally absent — it is legacy and a
// forbidden import for runtime plugins.
// React Router and i18next are shared because the host's Router and its one
// i18next instance (set up by @ohif/i18n) hold state a plugin's own copy can't
// see: a bundled react-router throws outside the host's Router, and a bundled
// i18next or react-i18next shows untranslated keys. Both packages of each pair
// are listed, so a plugin gets the host's copy whichever name it imports.
// Regex externals above (/^@ohif/, /^@cornerstonejs/, vtk.js) intentionally
// match MORE than this list. Every extension and mode compiled into the viewer
// shares itself on window once it has loaded (sharePlugin in
// platform/app/src/runtimeExtensionLoader.ts, with no compatibility promise);
// extensions loaded on demand are on window only after a mode, or the app
// config's extensions list, has loaded them. vtk.js and the @cornerstonejs/*
// packages other than core and tools are externalized with no host global — a
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
  'react-router',
  'react-router-dom',
  'i18next',
  'react-i18next',
];
module.exports.hostSharedPackages = hostSharedPackages;

// The published SDK: the @ohif packages published to npm as libraries, which a
// plugin author installs and compiles against. scripts/verify-tarballs.mjs
// takes its publish set from this list, and create-ohif keeps a copy that
// platform/create-ohif/tests/migrate.test.mjs compares with it.
// Every package here must also be in hostSharedPackages
// (runtimeShared.test.js checks that). The reverse is not required: a fork can
// add a package of its own to hostSharedPackages without publishing it.
const publishedSdkPackages = [
  '@ohif/core',
  '@ohif/ui-next',
  '@ohif/i18n',
  '@ohif/extension-default',
  '@ohif/extension-cornerstone',
];
module.exports.publishedSdkPackages = publishedSdkPackages;
