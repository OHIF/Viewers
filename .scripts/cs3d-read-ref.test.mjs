/**
 * Tests of .scripts/cs3d-read-ref.mjs, the one parser of the `CS3D_REF:` line.
 *
 * Run: node --test .scripts/cs3d-read-ref.test.mjs
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readRef, findPullRequest, fetchBody } from './cs3d-read-ref.mjs';

const REJECT = 'reject';

// [body, expected kind, expected ref] or [body, REJECT].
const BODIES = {
  'no line': ['A body with no request.\n', 'none'],
  'empty value': ['CS3D_REF:\n', 'none'],
  branch: [
    'Intro\n\nCS3D_REF: fix/display-set-split-key-stability\n\nMore\n',
    'branch',
    'fix/display-set-split-key-stability',
  ],
  'CRLF branch': ['Intro\r\nCS3D_REF: feat/foo\r\nMore\r\n', 'branch', 'feat/foo'],
  'trailing spaces': ['CS3D_REF: feat/spaces   \n', 'branch', 'feat/spaces'],
  'digit-led branch': ['CS3D_REF: 5.x-backport\n', 'branch', '5.x-backport'],
  'exact version': ['CS3D_REF: 5.10.3\n', 'version', '5.10.3'],
  prerelease: ['CS3D_REF: 5.11.0-rc-1\n', 'version', '5.11.0-rc-1'],
  'major range': ['CS3D_REF: 5.x\n', 'version', '5.x'],
  'minor range': ['CS3D_REF: 5.10.x\n', 'version', '5.10.x'],
  'plus range': ['CS3D_REF: 4.19+\n', 'version', '4.19+'],
  'two-part number': ['CS3D_REF: 5.10\n', REJECT],
  'bare major': ['CS3D_REF: 5\n', REJECT],
  'now with a range': ['CS3D_REF: fix/x now 5.x\n', REJECT],
  annotation: ['CS3D_REF: fix/x (released as 5.25.80)\n', REJECT],
  'leading dash': ['CS3D_REF: -rf\n', REJECT],
  'double dot': ['CS3D_REF: a..b\n', REJECT],
  'owner form': ['CS3D_REF: someone:branch\n', REJECT],
  'fork URL': [
    'CS3D_REF: https://github.com/mbellehumeur/cornerstone3D/tree/feat/viewport-fidelity-state\n',
    REJECT,
  ],
  'trailing slash': ['CS3D_REF: feat/\n', REJECT],
  'dot component': ['CS3D_REF: feat/.hidden\n', REJECT],
  'lock suffix': ['CS3D_REF: feat.lock\n', REJECT],
  'three spaces': ['   CS3D_REF: feat/three\n', 'branch', 'feat/three'],
  'indented code': ['    CS3D_REF: feat/indented\n', 'none'],
  'tab indented': ['\tCS3D_REF: feat/tab\n', 'none'],
  'fenced example then live': [
    '```\nCS3D_REF: example\n```\nCS3D_REF: live/branch\n',
    'branch',
    'live/branch',
  ],
  'tilde fence': ['~~~\nCS3D_REF: example\n~~~\n', 'none'],
  'longer fence not closed by shorter': [
    '````\n```\nCS3D_REF: inside\n```\n````\nCS3D_REF: after/fence\n',
    'branch',
    'after/fence',
  ],
  'comment block': ['<!--\nCS3D_REF: in/comment\n-->\nCS3D_REF: live\n', 'branch', 'live'],
  'one-line comment': ['<!-- CS3D_REF: in/comment -->\n', 'none'],
  'unclosed fence': ['Text\n```\nCS3D_REF: hidden\n', REJECT],
  'unclosed comment': ['<!--\nCS3D_REF: hidden\n', REJECT],
};

for (const [name, [body, kind, ref]] of Object.entries(BODIES)) {
  test(`reads the body: ${name}`, () => {
    if (kind === REJECT) {
      assert.throws(() => readRef(body), /CS3D_REF|CS3D ref/);
      return;
    }
    const result = readRef(body);
    assert.equal(result.kind, kind);
    if (ref) assert.equal(result.ref, ref);
  });
}

test('warns about a skipped line when no live line exists', () => {
  assert.match(readRef('    CS3D_REF: feat/indented\n').warning, /line 1/);
});

test('defers a `now` clause in a PR body, but not in a manual request', () => {
  const body = 'CS3D_REF: fix/x now 5.10.6\n';
  assert.deepEqual(readRef(body), {
    kind: 'version',
    ref: '5.10.6',
    history: 'fix/x',
    defer: true,
    warning: '',
  });
  assert.equal(readRef(body, { deferNow: false }).defer, false);
});

test('strips control characters from a rejected value in the message', () => {
  assert.throws(
    () => readRef('CS3D_REF: bad\x1b[31m value\n'),
    error => {
      assert.doesNotMatch(error.message, /\x1b/);
      return true;
    }
  );
});

test('finds the pull request from CircleCI', () => {
  assert.deepEqual(
    findPullRequest({ CIRCLE_PULL_REQUEST: 'https://github.com/OHIF/Viewers/pull/6137' }),
    { repo: 'OHIF/Viewers', number: '6137' }
  );
  assert.equal(findPullRequest({}), null);
});

test('finds the pull request of a Netlify deploy preview', () => {
  const preview = {
    NETLIFY: 'true',
    CONTEXT: 'deploy-preview',
    BUILD_ID: 'abc123',
    REVIEW_ID: '6137',
    REPOSITORY_URL: 'https://github.com/OHIF/Viewers',
  };
  const viewers = { repo: 'OHIF/Viewers', number: '6137' };
  for (const [env, expected] of [
    [preview, viewers],
    [{ ...preview, REPOSITORY_URL: 'git@github.com:OHIF/Viewers.git' }, viewers],
    [
      { ...preview, REPOSITORY_URL: 'https://github.com/foo/my.repo' },
      { repo: 'foo/my.repo', number: '6137' },
    ],
    [{ ...preview, CONTEXT: 'production' }, null],
    [{ ...preview, REVIEW_ID: '' }, null],
    [{ ...preview, REVIEW_ID: '6137a' }, null],
    [{ ...preview, NETLIFY: undefined }, null],
    // A local `netlify build`.
    [{ ...preview, NETLIFY_LOCAL: 'true' }, null],
    [{ ...preview, BUILD_ID: '' }, null],
  ]) {
    assert.deepEqual(findPullRequest(env), expected);
  }
});

test('never puts the token in the error of a failed body request', async t => {
  t.mock.method(globalThis, 'fetch', async () => new Response('', { status: 401 }));
  await assert.rejects(
    fetchBody({ repo: 'OHIF/Viewers', number: '1' }, { token: 'SECRET123' }),
    error => {
      assert.equal(error.message, 'HTTP 401');
      return true;
    }
  );
});

test('retries without the token when GitHub rejects the token', async t => {
  t.mock.method(console, 'error', () => {});
  const fetchMock = t.mock.method(globalThis, 'fetch', async (url, { headers }) =>
    headers.Authorization
      ? new Response('', { status: 401 })
      : Response.json({ body: 'CS3D_REF: 5.1.0' })
  );
  const body = await fetchBody({ repo: 'OHIF/Viewers', number: '1' }, { token: 'EXPIRED' });
  assert.equal(body, 'CS3D_REF: 5.1.0');
  assert.equal(fetchMock.mock.callCount(), 2);
});
