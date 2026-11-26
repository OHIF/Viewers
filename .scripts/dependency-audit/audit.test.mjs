// Tests for audit.mjs. Run with `npm test` in this folder (node --test).
// None of them reach npm's advisory endpoint: the end-to-end cases are ones
// where there is nothing to look up.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  addedIgnores,
  addedPackages,
  escapeCommand,
  ignoreLabel,
  isIgnoreId,
  lockfilePackages,
  packageChanges,
  showLockfileText,
  tableCell,
} from './audit.mjs';

const SCRIPT = fileURLToPath(new URL('./audit.mjs', import.meta.url));

/** A pnpm 12 lockfile: pnpm's own lock, then the project lock with `packages`. */
function lockfile(packageKeys) {
  return [
    '---',
    "lockfileVersion: '9.0'",
    '',
    'packages:',
    '',
    '  pnpm@12.8.1:',
    '    resolution: {integrity: sha512-pnpm}',
    '',
    '---',
    "lockfileVersion: '9.0'",
    '',
    'packages:',
    '',
    ...packageKeys.map(key => `  '${key}':\n    resolution: {integrity: sha512-x}\n`),
  ].join('\n');
}

function workspace(ignoreGhsas) {
  // JSON strings are valid YAML double-quoted strings, escapes included.
  return ['auditConfig:', '  ignoreGhsas:', ...ignoreGhsas.map(g => `    - ${JSON.stringify(g)}`)]
    .join('\n')
    .concat('\n');
}

/** Runs audit.mjs on the given file contents; null leaves that file out. */
function runAudit({ baseLock, headLock, baseIgnores = [], headIgnores = [] }) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dependency-audit-test-'));
  const file = (name, content) => {
    const target = path.join(dir, name);
    if (content !== null) {
      fs.writeFileSync(target, content);
    }
    return target;
  };
  const env = { ...process.env };
  env.GITHUB_OUTPUT = file('github-output.txt', '');
  delete env.GITHUB_STEP_SUMMARY;
  const result = spawnSync(
    process.execPath,
    [
      SCRIPT,
      '--base',
      file('base-lock.yaml', baseLock),
      '--head',
      file('head-lock.yaml', headLock),
      '--base-workspace',
      file('base-workspace.yaml', workspace(baseIgnores)),
      '--head-workspace',
      file('head-workspace.yaml', workspace(headIgnores)),
    ],
    { encoding: 'utf8', env }
  );
  const output = fs.readFileSync(env.GITHUB_OUTPUT, 'utf8');
  fs.rmSync(dir, { recursive: true, force: true });
  return {
    code: result.status,
    lines: result.stdout.split(/\r?\n/),
    stdout: result.stdout,
    output,
  };
}

test('lockfilePackages reads both YAML documents and splits scoped names', () => {
  const packages = lockfilePackages(
    lockfile(['@babel/core@7.28.0', 'left-pad@1.3.0', 'foo@git+ssh://git@github.com/o/r.git#abc'])
  );
  assert.deepEqual([...packages.get('pnpm')], ['12.8.1']);
  assert.deepEqual([...packages.get('@babel/core')], ['7.28.0']);
  assert.deepEqual([...packages.get('left-pad')], ['1.3.0']);
  // A git+ssh version has an @ of its own.
  assert.deepEqual([...packages.get('foo')], ['git+ssh://git@github.com/o/r.git#abc']);
});

test('addedPackages lists only the versions the PR adds', () => {
  const base = lockfilePackages(lockfile(['left-pad@1.3.0']));
  const head = lockfilePackages(
    lockfile(['left-pad@1.3.0', 'left-pad@1.4.0', '@babel/core@7.28.0'])
  );
  assert.deepEqual(addedPackages(base, head), [
    { name: '@babel/core', version: '7.28.0' },
    { name: 'left-pad', version: '1.4.0' },
  ]);
});

test('packageChanges pairs before and after versions by package', () => {
  const base = lockfilePackages(
    lockfile(['left-pad@1.3.0', 'old-dep@0.9.1', 'ms@2.0.0', 'ms@2.1.2', 'zz-top@1.0.0'])
  );
  const head = lockfilePackages(
    lockfile(['left-pad@1.4.0', 'new-dep@1.2.0', 'ms@2.1.3', 'zz-top@2.0.0', 'aa-new@0.1.0'])
  );
  assert.deepEqual(packageChanges(base, head), [
    { name: 'left-pad', kind: 'updated', before: ['1.3.0'], after: ['1.4.0'] },
    {
      name: 'ms',
      kind: 'updated',
      before: ['2.0.0', '2.1.2'],
      after: ['2.1.3'],
    },
    { name: 'zz-top', kind: 'updated', before: ['1.0.0'], after: ['2.0.0'] },
    { name: 'aa-new', kind: 'new', before: [], after: ['0.1.0'] },
    { name: 'new-dep', kind: 'new', before: [], after: ['1.2.0'] },
    { name: 'old-dep', kind: 'removed', before: ['0.9.1'], after: [] },
  ]);
});

test('a package that gains or drops one of its versions counts as updated', () => {
  const { stdout, output } = runAudit({
    baseLock: lockfile(['ms@2.0.0', 'debug@4.3.4', 'debug@4.4.0']),
    // A git version, so there is nothing to look up.
    headLock: lockfile(['ms@2.0.0', 'ms@git+https://example.com/ms.git', 'debug@4.4.0']),
  });
  assert.match(stdout, /Packages changed \(2\): 2 updated, 0 new, 0 removed/);
  assert.ok(
    output.includes('changes_updated=2\nchanges_new=0\nchanges_removed=0\nchanges_total=2\n')
  );
});

test('addedIgnores lists the ignores the PR adds, once each', () => {
  assert.deepEqual(
    addedIgnores(['GHSA-aaaa-bbbb-cccc'], ['GHSA-aaaa-bbbb-cccc', 'npm-123', 'npm-123']),
    ['npm-123']
  );
});

test('only GHSA IDs and npm-<number> are valid ignore entries', () => {
  assert.equal(isIgnoreId('GHSA-jqcg-44mw-7w3h'), true);
  assert.equal(isIgnoreId('npm-1102345'), true);
  assert.equal(isIgnoreId('CVE-2026-1234'), false);
  assert.equal(isIgnoreId('x\n::notice::INJECTED'), false);
  assert.equal(ignoreLabel('x\n::notice::INJECTED'), 'xnoticeINJECTED');
  assert.equal(ignoreLabel('::'), '(empty)');
});

test('escapeCommand encodes the characters that end a workflow command', () => {
  assert.equal(escapeCommand('a%b\r\nc'), 'a%25b%0D%0Ac');
});

test('tableCell keeps advisory titles inside their Markdown table cell', () => {
  assert.equal(tableCell('a|b'), 'a\\|b');
  // A trailing backslash must not escape the cell's closing pipe.
  assert.equal(tableCell('ends in \\'), 'ends in \\\\');
  assert.equal(tableCell('\\|'), '\\\\\\|');
  assert.equal(tableCell(undefined), '');
});

test('showLockfileText shows what could break a row or disguise lockfile text', () => {
  // A zero-width or trailing space must not make a key look like the real
  // left-pad.
  assert.equal(showLockfileText('left-pad\u200b'), 'left-pad[U+200B]');
  assert.equal(showLockfileText('left-pad '), 'left-pad[U+0020]');
  // Pipe, backtick, backslash, newline, right-to-left override, C1 control
  // (NEL), line separator and a Cyrillic look-alike of "a".
  assert.equal(
    showLockfileText('|`\\\n\u202e\u0085\u2028\u0430'),
    '[U+007C][U+0060][U+005C][U+000A][U+202E][U+0085][U+2028][U+0430]'
  );
  assert.equal(
    showLockfileText('@scope/pkg@1.2.3-beta.1+build.5'),
    '@scope/pkg@1.2.3-beta.1+build.5'
  );
});

test('PR text cannot inject workflow commands into the log', () => {
  const lock = lockfile(['left-pad@1.3.0']);
  const { code, lines } = runAudit({
    baseLock: lock,
    headLock: lock,
    headIgnores: ['x\n::notice::INJECTED'],
  });
  assert.equal(code, 0);
  // Layer 1: the entry is cleaned, so its text never starts a line.
  assert.equal(
    lines.findIndex(line => line.startsWith('::notice')),
    -1,
    'no injected command reaches the log'
  );
  // Layer 2: the report is printed while workflow commands are paused, and
  // our own annotations come after they resume.
  const stop = lines.findIndex(line => line.startsWith('::stop-commands::'));
  const token = lines[stop]?.slice('::stop-commands::'.length);
  const report = lines.indexOf('## Dependency audit');
  const resume = lines.indexOf(`::${token}::`);
  const warning = lines.findIndex(line => line.startsWith('::warning'));
  assert.ok(stop >= 0 && token.length > 0, 'commands are paused');
  assert.ok(stop < report && report < resume, 'the report is inside the pause');
  assert.ok(resume < warning, 'our own warning comes after commands resume');
  assert.match(lines[warning], /xnoticeINJECTED added/);
});

test('fails when the PR deletes the lockfile, and lists every package as removed', () => {
  const { code, stdout, output } = runAudit({
    baseLock: lockfile(['left-pad@1.3.0']),
    headLock: null,
  });
  assert.equal(code, 1);
  assert.match(stdout, /deletes pnpm-lock.yaml/);
  // pnpm itself and left-pad.
  assert.match(stdout, /Packages changed \(2\): 0 updated, 0 new, 2 removed/);
  assert.ok(output.includes('changes_removed=2\nchanges_total=2\n'));
});

test('passes when neither side has a lockfile', () => {
  const { code, stdout, output } = runAudit({ baseLock: null, headLock: null });
  assert.equal(code, 0);
  assert.match(stdout, /nothing to audit/);
  // No changes: the workflow posts no "Dependency changes" status.
  assert.ok(output.includes('changes_total=0\n'));
});

test('fails when many added entries cannot be audited', () => {
  const base = lockfile(['left-pad@1.3.0']);
  const gitEntries = Array.from(
    { length: 6 },
    (_, i) => `pkg${i}@git+https://example.com/pkg${i}.git`
  );
  const { code, stdout } = runAudit({
    baseLock: base,
    headLock: lockfile(['left-pad@1.3.0', ...gitEntries]),
  });
  assert.equal(code, 1);
  assert.match(stdout, /format may have changed/);
  // The changes table lists them too, one row per package.
  assert.match(stdout, /Packages changed \(6\)/);
  assert.ok(stdout.includes('| `pkg0` | – | `git+https://example.com/pkg0.git` |'));
});

test('a very long lockfile key cannot push the report over the summary limit', () => {
  // 150,000 zero-width spaces are 1.2 MB once shown as [U+200B]. An explicit
  // YAML key, because an implicit key has at most 1024 characters.
  const key = JSON.stringify(`big@1.0.0${'​'.repeat(150_000)}`);
  const { stdout } = runAudit({
    baseLock: lockfile([]),
    headLock: `${lockfile([])}  ? ${key}\n  : resolution: {integrity: sha512-x}\n`,
  });
  assert.match(stdout, /Packages changed \(1\)/);
  assert.ok(stdout.includes('[U+200B]…`'));
  assert.ok(stdout.length < 10_000);
});

test('the changes table keeps lockfile text in its cell and stops at 300 rows', () => {
  const gitEntries = Array.from(
    { length: 301 },
    (_, i) => `pkg${i}@git+https://example.com/pkg${i}.git`
  );
  // A key a PR could write: a pipe, backslash, newline and right-to-left
  // override in the version. JSON is valid YAML double-quoted text.
  const evil = JSON.stringify('evil@1.0|x\\y\n\u202ez');
  const { stdout, output } = runAudit({
    baseLock: lockfile([]),
    headLock: `${lockfile(gitEntries)}  ${evil}:\n    resolution: {integrity: sha512-x}\n`,
  });
  assert.match(stdout, /Packages changed \(302\)/);
  assert.ok(stdout.includes('\n| `evil` | – | `1.0[U+007C]x[U+005C]y[U+000A][U+202E]z` |\n'));
  assert.equal(stdout.split('\n').filter(line => line.startsWith('| `')).length, 300);
  assert.match(stdout, /Packages changed \(302\): 0 updated, 302 new, 0 removed/);
  assert.ok(stdout.includes('…and 2 more (see the `pnpm-lock.yaml` diff).'));
  // Counts for the "Dependency changes" status.
  assert.ok(
    output.includes('changes_updated=0\nchanges_new=302\nchanges_removed=0\nchanges_total=302\n')
  );
});
