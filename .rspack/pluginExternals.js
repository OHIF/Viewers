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
