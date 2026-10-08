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
  delete env.GITHUB_OUTPUT;
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
  fs.rmSync(dir, { recursive: true, force: true });
  return { code: result.status, lines: result.stdout.split(/\r?\n/), stdout: result.stdout };
}

test('lockfilePackages reads both YAML documents and splits scoped names', () => {
  const packages = lockfilePackages(lockfile(['@babel/core@7.28.0', 'left-pad@1.3.0']));
  assert.deepEqual([...packages.get('pnpm')], ['12.8.1']);
  assert.deepEqual([...packages.get('@babel/core')], ['7.28.0']);
  assert.deepEqual([...packages.get('left-pad')], ['1.3.0']);
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

test('fails when the PR deletes the lockfile', () => {
  const { code, stdout } = runAudit({ baseLock: lockfile(['left-pad@1.3.0']), headLock: null });
  assert.equal(code, 1);
  assert.match(stdout, /deletes pnpm-lock.yaml/);
});

test('passes when neither side has a lockfile', () => {
  const { code, stdout } = runAudit({ baseLock: null, headLock: null });
  assert.equal(code, 0);
  assert.match(stdout, /nothing to audit/);
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
});
