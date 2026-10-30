// Parity test: runtimeShared.ts <-> .rspack/pluginExternals.hostSharedPackages
// runtimeShared.ts is TS with side effects and heavy imports
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

// The settled v1 contract list (16 names; @ohif/i18n, React Router and i18next included, see
// .rspack/pluginExternals.js; @ohif/ui deliberately absent -- forbidden runtime-plugin import).
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
  'react-router',
  'react-router-dom',
  'i18next',
  'react-i18next',
];

// The major version of each shared third-party package (for a 0.x package, its
// minor: semver treats each 0.x minor as breaking). A runtime plugin is built
// against these and gets the host's copy at runtime, so moving one to a new
// major breaks plugins that are already built. When this fails, add a
// migration-guide entry for the change, update the versions listed under
// "Shared host packages" in platform/docs/docs/configuration/configurationFiles.md,
// then update the value here.
/** @type {Record<string, string>} */
const SHARED_MAJORS = {
  react: '19',
  'react-dom': '19',
  '@cornerstonejs/core': '5',
  '@cornerstonejs/tools': '5',
  dcmjs: '0.52',
  'gl-matrix': '3',
  'react-router': '6',
  'react-router-dom': '6',
  i18next: '19',
  'react-i18next': '12',
};

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

  // The `shared` object's keys are the window global names plugins read, so
  // check them too: each key must be a shared package, and its value the
  // module imported from that same package.
  test('the shared object maps each hostSharedPackages name to its own import', () => {
    const importedAs = Object.fromEntries(
      [...source.matchAll(/^import \* as (\w+) from '([^']+)';$/gm)].map(m => [m[2], m[1]])
    );
    const [, body = ''] = source.match(/const shared[^=]*=\s*\{([\s\S]*?)\};/) ?? [];
    const entries = [...body.matchAll(/^\s*(?:'([^']+)'|(\w+))\s*(?::\s*(\w+))?\s*,/gm)].map(m => [
      m[1] ?? m[2],
      m[3] ?? m[2],
    ]);
    expect(entries.map(([key]) => key).sort()).toEqual([...externals.hostSharedPackages].sort());
    for (const [key, value] of entries) {
      expect([key, value]).toEqual([key, importedAs[key]]);
    }
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

  // Reads the installed copy the viewer bundles (the repo-root node_modules:
  // pnpm node-linker=hoisted). @ohif/* packages are versioned with OHIF itself,
  // and react/jsx-runtime is part of react.
  test('the shared third-party packages are on the majors runtime plugins are built against', () => {
    const thirdParty = externals.hostSharedPackages.filter(
      name => !name.startsWith('@ohif/') && name !== 'react/jsx-runtime'
    );
    expect(Object.keys(SHARED_MAJORS).sort()).toEqual([...thirdParty].sort());
    for (const name of thirdParty) {
      const manifest = path.join(__dirname, '../../../node_modules', name, 'package.json');
      const [major, minor] = JSON.parse(fs.readFileSync(manifest, 'utf8')).version.split('.');
      const line = major === '0' ? `0.${minor}` : major;
      expect(`${name}@${line}`).toBe(`${name}@${SHARED_MAJORS[name]}`);
    }
  });
});
