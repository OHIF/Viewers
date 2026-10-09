// Tests for dist-packages.mjs. Run with `npm test` in this folder (node --test).
import assert from 'node:assert/strict';
import path from 'node:path';
import { test } from 'node:test';

import {
  distPackages,
  lockfileTree,
  packageOfPath,
  pnpmStoreVersion,
  sourcePath,
} from './dist-packages.mjs';

const toPosix = p => p.split(path.sep).join('/');

test('packageOfPath finds the innermost package, skipping .pnpm store folders', () => {
  assert.deepEqual(packageOfPath('/r/node_modules/axios/lib/a.js'), {
    name: 'axios',
    dir: '/r/node_modules/axios',
  });
  assert.equal(packageOfPath('/r/node_modules/a/node_modules/@s/b/x.js').name, '@s/b');
  assert.equal(
    packageOfPath('/r/node_modules/.pnpm/deepmerge-ts@8.0.1/node_modules/deepmerge-ts/i.mjs').name,
    'deepmerge-ts'
  );
  assert.equal(packageOfPath('/r/platform/core/src/x.ts'), null);
});

test('pnpmStoreVersion reads the version from a .pnpm store path', () => {
  const store = '/r/node_modules/.pnpm';
  assert.equal(
    pnpmStoreVersion(`${store}/deepmerge-ts@8.0.1/node_modules/deepmerge-ts/i.mjs`, 'deepmerge-ts'),
    '8.0.1'
  );
  assert.equal(
    pnpmStoreVersion(
      `${store}/@floating-ui+dom@1.8.0_x@1/node_modules/@floating-ui/dom/i.js`,
      '@floating-ui/dom'
    ),
    '1.8.0'
  );
  assert.equal(pnpmStoreVersion('/r/node_modules/core-js/a.js', 'core-js'), null);
});

test('sourcePath turns source-map entries into file paths', () => {
  const context = path.resolve('/repo/platform/app');
  assert.equal(
    sourcePath('webpack:///../../node_modules/moment|sync', context),
    path.resolve('/repo/node_modules/moment')
  );
  assert.equal(sourcePath('webpack:///./src/index.tsx', context), null);
});

// A lockfile with two YAML documents, as pnpm 12 writes it.
const LOCKFILE = [
  '---',
  "lockfileVersion: '9.0'",
  'snapshots:',
  '  pnpm@12.8.1: {}',
  '---',
  "lockfileVersion: '9.0'",
  'snapshots:',
  '  viewer-lib@1.0.0(react@19.0.0):',
  '    dependencies:',
  '      ol: 10.0.0',
  "      '@ohif/core': link:../core",
  '    optionalDependencies:',
  '      fsevents: 2.3.3',
  '  ol@10.0.0:',
  '    dependencies:',
  '      rbush: 4.0.1',
  '  rbush@4.0.1: {}',
  '  fsevents@2.3.3: {}',
  '  unrelated@1.0.0: {}',
  '',
].join('\n');

test('lockfileTree follows dependencies through both documents, skipping workspace links', () => {
  assert.deepEqual(
    lockfileTree(LOCKFILE, [{ name: 'viewer-lib', version: '1.0.0' }])
      .map(p => `${p.name}@${p.version}`)
      .sort(),
    ['fsevents@2.3.3', 'ol@10.0.0', 'rbush@4.0.1', 'viewer-lib@1.0.0']
  );
  assert.throws(
    () => lockfileTree(LOCKFILE, [{ name: 'viewer-lib', version: '2.0.0' }]),
    /viewer-lib@2.0.0 is not in pnpm-lock.yaml/
  );
});

test('distPackages combines our source maps with copied packages and their lockfile trees', () => {
  const root = path.resolve('/repo');
  const at = rel => path.join(root, rel);
  const dist = at('platform/app/dist');
  const installed = {
    [at('node_modules/axios/package.json')]: '1.20.0',
    [at('node_modules/viewer-lib/package.json')]: '1.0.0',
  };
  const webpack = rel => `webpack:///${toPosix(at(rel))}`;
  const maps = {
    [path.join(dist, 'app.bundle.js.map')]: [
      webpack('node_modules/axios/lib/a.js'),
      // Inlined by another library, from its own map; not installed here.
      webpack('node_modules/.pnpm/deepmerge-ts@8.0.1/node_modules/deepmerge-ts/dist/index.mjs'),
      webpack('platform/core/src/index.ts'),
    ],
    // The copied package's own map: skipped (its lockfile tree covers it).
    [path.join(dist, 'viewer-lib', 'viewer.min.js.map')]: [webpack('node_modules/ignored/x.js')],
  };
  const fsx = {
    exists: p =>
      Object.hasOwn(installed, path.resolve(p)) ||
      Object.keys(installed).some(pj => path.dirname(pj) === path.resolve(p)),
    readJson: p => (maps[p] ? { sources: maps[p] } : { version: installed[path.resolve(p)] }),
    listMaps: () => Object.keys(maps),
  };
  const record = {
    context: at('platform/app'),
    distRoot: dist,
    copyRules: [
      { from: at('node_modules/viewer-lib/dist'), to: path.join(dist, 'viewer-lib') },
      { from: at('platform/app/public/assets'), to: path.join(dist, 'assets') }, // OHIF's own
    ],
  };
  const { packages, fromMaps, copied } = distPackages(record, LOCKFILE, { fsx });
  const one = versions => ({ versions, anyVersion: false });
  assert.deepEqual(packages, {
    axios: one(['1.20.0']),
    'deepmerge-ts': one(['8.0.1']),
    fsevents: one(['2.3.3']),
    ol: one(['10.0.0']),
    rbush: one(['4.0.1']),
    'viewer-lib': one(['1.0.0']),
  });
  assert.equal(fromMaps, 2); // axios and the inlined deepmerge-ts
  assert.deepEqual(copied, ['viewer-lib']);

  // Maps whose paths don't show node_modules yield nothing: the caller fails
  // rather than report "nothing in the build".
  const changed = distPackages(record, LOCKFILE, {
    fsx: {
      ...fsx,
      readJson: p => (maps[p] ? { sources: ['webpack://app/./x.js'] } : fsx.readJson(p)),
    },
  });
  assert.equal(changed.fromMaps, 0);

  // Only CSS maps (JavaScript maps turned off): their packages are listed, but
  // the count stays 0 so the caller fails.
  const cssOnly = {
    [path.join(dist, 'app.bundle.css.map')]: [webpack('node_modules/axios/a.css')],
  };
  const css = distPackages(record, LOCKFILE, {
    fsx: {
      ...fsx,
      listMaps: () => Object.keys(cssOnly),
      readJson: p => (cssOnly[p] ? { sources: cssOnly[p] } : fsx.readJson(p)),
    },
  });
  assert.equal(css.fromMaps, 0);
  assert.ok(css.packages.axios);
});
