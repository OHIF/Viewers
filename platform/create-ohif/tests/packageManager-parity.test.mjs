// Every create-ohif template that ships a package.json pins the same pnpm as the
// repo. The templates are copied into scaffolds that have no repo root above
// them, so they carry the value themselves; this test is the tripwire for a
// pnpm bump in the root package.json that forgets the templates. migrate's
// packageManager flag reads its suggestion from the workspace template, so it
// stays in step too.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const readJson = url => JSON.parse(readFileSync(url, 'utf8'));
// ../../.. from platform/create-ohif/tests/ is the repo root.
const rootPackageManager = readJson(
  new URL('../../../package.json', import.meta.url)
).packageManager;

test('the repo root package.json pins pnpm (guards the path)', () => {
  assert.match(String(rootPackageManager), /^pnpm@\d+\.\d+\.\d+$/);
});

for (const tpl of ['workspace', 'extension', 'mode']) {
  test(`templates/${tpl}/package.json pins the repo's packageManager`, () => {
    const pkg = readJson(new URL(`../templates/${tpl}/package.json`, import.meta.url));
    assert.equal(pkg.packageManager, rootPackageManager);
  });
}
