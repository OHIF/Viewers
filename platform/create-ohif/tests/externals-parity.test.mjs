// WS5.7: the sync mechanism for the embedded externals copies. Templates
// cannot require files outside the scaffolded package, so each template
// vendors a copy of the repo's .rspack/pluginExternals.js; this test failing
// is the intended tripwire whenever the contract externals change.
//
// Complementary to platform/app/src/runtimeShared.test.js, which pins the
// host-globals list against the same canonical file: together they enforce
// template externals === host-provided globals.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
// ../../.. from platform/create-ohif/tests/ is the repo root.
const canonical = require('../../../.rspack/pluginExternals.js');

for (const tpl of ['extension', 'mode']) {
  test(`templates/${tpl} pluginExternals matches the repo canonical list`, () => {
    const copy = require(`../templates/${tpl}/_rspack/pluginExternals.js`);
    // String() normalizes RegExp vs string entries for the comparison.
    assert.deepEqual(copy.map(String), canonical.map(String));
  });
}

test('canonical pluginExternals is a non-empty array (guards the require path)', () => {
  assert.ok(Array.isArray(canonical) && canonical.length > 0);
});
