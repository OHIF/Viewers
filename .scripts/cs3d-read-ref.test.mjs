/**
 * Checks that .scripts/cs3d-read-ref.mjs reads a pull request body the same
 * way as the `gate` job of .github/workflows/playwright.yml.
 *
 * The test runs the real step script of the gate from the workflow file, with
 * a fake `gh` that returns each body below, and compares the outputs of the
 * gate with the result of the port. It needs bash, awk and git on PATH.
 *
 * Run: node --test .scripts/cs3d-read-ref.test.mjs
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import { parseBody, classify, findPullRequest } from './cs3d-read-ref.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const workflow = YAML.parse(readFileSync(join(root, '.github/workflows/playwright.yml'), 'utf8'));
const gateScript = workflow.jobs.gate.steps.find(s => s.id === 'decide').run;

function runGate(body) {
  const dir = mkdtempSync(join(tmpdir(), 'cs3d-gate-'));
  try {
    writeFileSync(join(dir, 'body.md'), body);
    writeFileSync(join(dir, 'output'), '');
    writeFileSync(join(dir, 'gate.sh'), gateScript);
    const toBash = p => p.replace(/\\/g, '/');
    // An exported function, not a file on PATH: a function takes precedence
    // over any real `gh`, whatever the PATH translation of the platform does.
    const r = spawnSync(
      'bash',
      [
        '-c',
        'gh() { case "$*" in *"/files"*) return 0 ;; esac; cat "$FAKE_BODY"; }; export -f gh; bash "$GATE"',
      ],
      {
        encoding: 'utf8',
        env: {
          ...process.env,
          GATE: toBash(join(dir, 'gate.sh')),
          FAKE_BODY: toBash(join(dir, 'body.md')),
          GITHUB_OUTPUT: toBash(join(dir, 'output')),
          GITHUB_REPOSITORY: 'OHIF/Viewers',
          EVENT_NAME: 'pull_request',
          PR_NUMBER: '1',
          IS_SAME_REPO: 'true',
        },
      }
    );
    const outputs = Object.fromEntries(
      readFileSync(join(dir, 'output'), 'utf8')
        .split('\n')
        .filter(Boolean)
        .map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)])
    );
    return { status: r.status, outputs, stderr: r.stderr, stdout: r.stdout };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function runPort(body) {
  const parsed = parseBody(body);
  if (!parsed.raw && parsed.skip && parsed.unclosed) return { rejected: true };
  try {
    return classify(parsed.raw);
  } catch {
    return { rejected: true };
  }
}

const BODIES = {
  'no line': 'A body with no request.\n',
  branch: 'Intro\n\nCS3D_REF: fix/display-set-split-key-stability\n\nMore text\n',
  'CRLF branch': 'Intro\r\nCS3D_REF: feat/foo\r\nMore\r\n',
  'exact version': 'CS3D_REF: 5.10.3\n',
  prerelease: 'CS3D_REF: 5.11.0-rc-1\n',
  'major range': 'CS3D_REF: 5.x\n',
  'minor range': 'CS3D_REF: 5.10.x\n',
  'plus range': 'CS3D_REF: 4.19+\n',
  'two-part number': 'CS3D_REF: 5.10\n',
  'bare major': 'CS3D_REF: 5\n',
  'digit-led branch': 'CS3D_REF: 5.x-backport\n',
  'now clause': 'CS3D_REF: fix/x now 5.10.6\n',
  'now with a range': 'CS3D_REF: fix/x now 5.x\n',
  annotation: 'CS3D_REF: fix/x (released as 5.25.80)\n',
  'leading dash': 'CS3D_REF: -rf\n',
  'double dot': 'CS3D_REF: a..b\n',
  'owner form': 'CS3D_REF: someone:branch\n',
  'trailing slash': 'CS3D_REF: feat/\n',
  'dot component': 'CS3D_REF: feat/.hidden\n',
  'lock suffix': 'CS3D_REF: feat.lock\n',
  'three spaces': '   CS3D_REF: feat/three\n',
  'indented code': '    CS3D_REF: feat/indented\n',
  'tab indented': '\tCS3D_REF: feat/tab\n',
  'fenced example then live': '```\nCS3D_REF: example\n```\nCS3D_REF: live/branch\n',
  'tilde fence': '~~~\nCS3D_REF: example\n~~~\n',
  'longer fence not closed by shorter':
    '````\n```\nCS3D_REF: inside\n```\n````\nCS3D_REF: after/fence\n',
  'unclosed fence': 'Text\n```\nCS3D_REF: hidden\n',
  'comment block': '<!--\nCS3D_REF: in/comment\n-->\nCS3D_REF: live\n',
  'one-line comment': '<!-- CS3D_REF: in/comment -->\n',
  'unclosed comment': '<!--\nCS3D_REF: hidden\n',
  'empty value': 'CS3D_REF:\n',
  'trailing spaces': 'CS3D_REF: feat/spaces   \n',
};

for (const [name, body] of Object.entries(BODIES)) {
  test(`agrees with the gate: ${name}`, () => {
    const gate = runGate(body);
    const port = runPort(body);
    if (gate.status !== 0) {
      assert.equal(
        port.rejected,
        true,
        `the gate rejected the body:\n${gate.stdout}${gate.stderr}`
      );
      return;
    }
    assert.notEqual(port.rejected, true, 'the port rejected a body that the gate accepts');
    assert.equal(port.kind, gate.outputs.cs3d_kind);
    if (port.kind === 'none') return;
    assert.equal(port.ref, gate.outputs.cs3d_ref);
    assert.equal(port.history, gate.outputs.cs3d_history);
    assert.equal(String(port.defer), gate.outputs.cs3d_defer);
  });
}

test('finds the pull request from CircleCI', () => {
  assert.deepEqual(
    findPullRequest({ CIRCLE_PULL_REQUEST: 'https://github.com/OHIF/Viewers/pull/6137' }),
    { repo: 'OHIF/Viewers', number: '6137' }
  );
});

test('finds the pull request from Netlify', () => {
  assert.deepEqual(
    findPullRequest({
      PULL_REQUEST: 'true',
      REVIEW_ID: '6137',
      REPOSITORY_URL: 'https://github.com/OHIF/Viewers',
    }),
    { repo: 'OHIF/Viewers', number: '6137' }
  );
});

test('finds no pull request for a branch build', () => {
  assert.equal(findPullRequest({ PULL_REQUEST: 'false', REVIEW_ID: '' }), null);
});
