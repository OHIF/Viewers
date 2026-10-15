// Tests for daily.mjs. Run with `npm test` in this folder (node --test).
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { groupFindings, renderSummary, inDist } from './daily.mjs';

const distPackages = {
  axios: { versions: ['1.20.0'], anyVersion: false },
  'core-js': { versions: [], anyVersion: true },
};

const finding = (name, version, ghsa, severity) => ({
  name,
  version,
  ghsa,
  severity,
  url: `https://github.com/advisories/${ghsa}`,
});

test('inDist matches the exact version, or any version of an inlined package', () => {
  assert.equal(inDist(distPackages, 'axios', '1.20.0'), true);
  assert.equal(inDist(distPackages, 'axios', '1.18.1'), false);
  assert.equal(inDist(distPackages, 'core-js', '3.0.0'), true);
  assert.equal(inDist(distPackages, 'tar', '7.5.22'), false);
});

test('groupFindings sorts critical and high into the four lists', () => {
  const groups = groupFindings(
    [
      finding('tar', '7.5.22', 'GHSA-aaaa-aaaa-aaaa', 'critical'), // critical, not in dist
      finding('core-js', '3.0.0', 'GHSA-gggg-gggg-gggg', 'critical'), // critical, in dist (inlined)
      finding('axios', '1.20.0', 'GHSA-bbbb-bbbb-bbbb', 'high'), // high, in dist
      finding('axios', '1.18.1', 'GHSA-cccc-cccc-cccc', 'high'), // high, this version isn't in dist
      finding('compression', '1.8.1', 'GHSA-dddd-dddd-dddd', 'high'),
      finding('compression', '1.8.0', 'GHSA-dddd-dddd-dddd', 'high'), // same advisory and package: one row
      finding('braces', '3.0.3', 'GHSA-eeee-eeee-eeee', 'high'), // ignored
      finding('ms', '2.0.0', 'GHSA-ffff-ffff-ffff', 'moderate'), // left out
    ],
    distPackages,
    new Set(['GHSA-eeee-eeee-eeee'])
  );
  const ids = rows => rows.map(r => `${r.ghsa} ${r.name}`);
  assert.deepEqual(ids(groups.immediately), [
    'GHSA-bbbb-bbbb-bbbb axios',
    'GHSA-gggg-gggg-gggg core-js',
  ]);
  assert.deepEqual(ids(groups.promptly), ['GHSA-aaaa-aaaa-aaaa tar']);
  assert.deepEqual(ids(groups.soon), [
    'GHSA-cccc-cccc-cccc axios',
    'GHSA-dddd-dddd-dddd compression',
  ]);
  assert.deepEqual(ids(groups.ignored), ['GHSA-eeee-eeee-eeee braces']);
});

test('renderSummary shows only the advisory link and the package name', () => {
  const row = finding('sharp', '0.35.4', 'GHSA-wq5f-xc86-pv6w', 'high');
  const summary = renderSummary({
    label: 'master',
    date: 'Thu, 08 Oct 2026',
    immediately: [row],
    promptly: [],
    soon: [],
    updates: [],
  });
  assert.match(summary, /^## Dependency check of master – Thu, 08 Oct 2026/);
  assert.match(summary, /### Review immediately \(1\)/);
  assert.match(summary, /### Review promptly \(0\)\n\nNone\./);
  assert.ok(
    summary.includes(
      '| [GHSA-wq5f-xc86-pv6w](https://github.com/advisories/GHSA-wq5f-xc86-pv6w) | sharp |'
    )
  );
  assert.match(summary, /### Review soon \(0\)\n\nNone\./);
  assert.match(summary, /### Ignored, update available \(0\)/);
  // Nothing about severity or versions.
  assert.doesNotMatch(summary, /high|critical|0\.35\.4/);
});
