// WS5.1 skeleton invariants. Also keeps `node --test tests/` (the package's
// test / test:unit:ci scripts, fanned out by the root `pnpm -r run
// test:unit:ci`) green before WS5.7 lands the scaffold/parity suites --
// node --test exits nonzero when the tests directory has no test files.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

test('create-ohif manifest publish contract', () => {
  assert.equal(manifest.name, 'create-ohif');
  assert.notEqual(manifest.private, true, 'must not be private: it must publish');
  assert.equal(manifest.bin['create-ohif'], 'bin/create-ohif.mjs');
  assert.ok(manifest.files.includes('bin'));
  assert.ok(manifest.files.includes('templates'));
  assert.equal(manifest.publishConfig.access, 'public');
  assert.equal(manifest.type, 'module');
  assert.deepEqual(Object.keys(manifest.dependencies), ['@clack/prompts']);
  assert.equal(manifest.scripts['build:package'], undefined, 'no build step: ships raw .mjs');
});
