// Parity test: runtimeShared.ts <-> .rspack/pluginExternals.hostSharedPackages
// (WS7.5). runtimeShared.ts is TS with side effects and heavy imports
// (@cornerstonejs/* map through moduleNameMapper to dist/esm), so this test
// PARSES ITS SOURCE instead of importing it, and requires the CJS externals
// file directly.
//
// Asymmetry is intentional: regex externals (/^@ohif/, /^@cornerstonejs/,
// vtk.js) match MORE than the shared list. The tested invariants are
// (a) shared subset-of externalized and (b) exact-string externals (the react
// family, THE contract change) subset-of shared. vtk.js is externalized but
// has no host global -- a known v1 gap.
const fs = require('fs');
const path = require('path');
const externals = require('../../../.rspack/pluginExternals');

// The settled v1 contract list (12 names; @ohif/i18n included per GAP-1,
// @ohif/ui deliberately absent -- forbidden runtime-plugin import).
const SETTLED_LIST = [
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

describe('runtimeShared <-> pluginExternals parity', () => {
  const source = fs.readFileSync(path.join(__dirname, 'runtimeShared.ts'), 'utf8');
  const sharedImports = [...source.matchAll(/^import \* as \w+ from '([^']+)';$/gm)].map(
    m => m[1]
  );

  test('hostSharedPackages is exactly the settled v1 list', () => {
    expect([...externals.hostSharedPackages].sort()).toEqual([...SETTLED_LIST].sort());
  });

  test('runtimeShared.ts imports exactly hostSharedPackages', () => {
    expect([...sharedImports].sort()).toEqual([...externals.hostSharedPackages].sort());
  });

  test('every shared global is externalized (never double-bundled in plugins)', () => {
    for (const name of externals.hostSharedPackages) {
      expect(externals.some(e => (e instanceof RegExp ? e.test(name) : e === name))).toBe(true);
    }
  });

  test('every exact-string external has a host global', () => {
    for (const s of externals.filter(e => typeof e === 'string')) {
      expect(externals.hostSharedPackages).toContain(s);
    }
  });
});
