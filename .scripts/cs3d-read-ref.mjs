#!/usr/bin/env node

/**
 * Reads the `CS3D_REF:` line of a pull request body. This is the one parser of
 * that line: the `gate` job of .github/workflows/playwright.yml runs it, and
 * so does .scripts/ci/cs3d-apply-ref.sh in the CircleCI jobs and the Netlify
 * deploy preview.
 *
 * Usage:
 *   node .scripts/cs3d-read-ref.mjs                         find the PR from CircleCI or Netlify
 *   node .scripts/cs3d-read-ref.mjs --body-file <file>      parse a saved body
 *   node .scripts/cs3d-read-ref.mjs --body-file <file> --no-defer
 *       a manual request: `<branch> now <version>` is not deferred
 *
 * Prints four lines on stdout: <kind>, <ref>, <history>, <defer>. The kind is
 * `none`, `version` or `branch`. An empty value is an empty line; one value per
 * line keeps an empty field in place, which a tab-separated line does not
 * under bash `read`. Diagnostics go to stderr, as GitHub annotations under
 * GitHub Actions. A rejected line exits 1 and prints nothing on stdout.
 *
 * The gate runs the copy of this file on the default branch, never the copy of
 * the pull request, so a pull request cannot rewrite its own gate. A change to
 * this file therefore reaches the gate only after the merge.
 *
 * Without --body-file, the script reads the body through the GitHub API. When
 * the body cannot be read (no PR, a rate limit, a network fault), it reports
 * `none` with a warning, and the job uses the pinned CS3D. The gate fails
 * instead, because it also decides approval and feeds the merge guard. A
 * read-only GITHUB_TOKEN avoids the unauthenticated rate limit.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/** Parses a body into the live request, and the first skipped line. */
export function parseBody(body) {
  const result = { raw: '', skip: null, unclosed: false };
  const refval = s =>
    s
      .replace(/^.*CS3D_REF:[ \t]*/, '')
      .replace(/[ \t\r]+$/, '')
      .replace(/\t/g, ' ');
  let skips = 0;
  const note = (reason, lineNo, s) => {
    if (skips === 0) result.skip = { reason, line: lineNo, value: refval(s) };
    skips++;
  };

  // A CS3D_REF line is a request only at the top level of the body. A fenced
  // code block, an indented code block and an HTML comment quote text rather
  // than state it; the OHIF PR template is mostly HTML comments. Up to three
  // spaces still count as top level, as in markdown.
  let fence = '';
  let flen = 0;
  let comment = false;
  let openSkip = false;
  // Lines split on "\n" only, with one trailing "\r" stripped.
  const lines = body.split('\n');
  if (lines.length && lines[lines.length - 1] === '') lines.pop();

  for (let i = 0; i < lines.length; i++) {
    const lineNo = i + 1;
    const line = lines[i].replace(/\r$/, '');

    // A tab counts as four columns, as markdown reads it.
    let ind = 0;
    for (const c of line) {
      if (c === ' ') ind++;
      else if (c === '\t') ind += 4;
      else break;
    }
    const text = line.replace(/^[ \t]+/, '');
    const startsRef = /^CS3D_REF:/.test(text);

    const runOf = ch => {
      let n = 0;
      while (text[n] === ch) n++;
      return n;
    };

    if (fence !== '') {
      // A closing fence repeats the opening marker, is at least as long, and
      // carries nothing else.
      const ch = text[0];
      const n = ind < 4 && (ch === '`' || ch === '~') ? runOf(ch) : 0;
      if (n >= 3 && ch === fence && n >= flen && /^[ \t]*$/.test(text.slice(n))) {
        fence = '';
        openSkip = false;
        continue;
      }
      if (startsRef) {
        note('fence', lineNo, text);
        openSkip = true;
      }
      continue;
    }

    if (comment) {
      const closes = line.includes('-->');
      if (startsRef) {
        note('comment', lineNo, text);
        openSkip = true;
      }
      if (closes) {
        comment = false;
        openSkip = false;
      }
      continue;
    }

    if (ind >= 4) {
      if (startsRef) note('indent', lineNo, text);
      continue;
    }

    const ch = text[0];
    const n = ch === '`' || ch === '~' ? runOf(ch) : 0;
    if (n >= 3) {
      fence = ch;
      flen = n;
      openSkip = false;
      continue;
    }

    if (/^<!--/.test(text)) {
      openSkip = false;
      if (!line.includes('-->')) comment = true;
      if (/CS3D_REF:/.test(text)) {
        note('comment', lineNo, text);
        if (comment) openSkip = true;
      }
      continue;
    }

    if (startsRef) {
      // The whole remainder of the line, so that the grammar rejects an
      // annotation such as `fix/x (released as 5.25.80)`.
      result.raw = refval(text);
      // A skip matters only when no live line exists.
      result.skip = null;
      return result;
    }
  }

  // An unclosed fence or comment hides every line below it.
  if ((fence !== '' || comment) && openSkip) result.unclosed = true;
  return result;
}

const REF_GRAMMAR = /^[A-Za-z0-9][A-Za-z0-9._/+-]*$/;
const CONCRETE_VERSION = /^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?$/;
// Exactly the forms that .scripts/cs3d-resolve-version.mjs accepts:
// 5.10.3, 5.11.0-beta.1, 5.x, 5.10.x and 4.19+.
const VERSION_FORMS = /^[0-9]+(\.[0-9]+(\.([0-9]+(-[0-9A-Za-z.-]+)?|x)|\+)|\.x)$/;

/** The shape rules of `git check-ref-format refs/heads/<part>`, for the grammar above. */
function isLegalRefName(part) {
  if (part.endsWith('/') || part.includes('//')) return false;
  if (part.endsWith('.') || part.endsWith('.lock')) return false;
  return part.split('/').every(c => c !== '' && !c.startsWith('.') && !c.endsWith('.lock'));
}

/**
 * Validates and classifies the raw value of a CS3D_REF line. Throws an Error
 * with a message for the PR author when it rejects the value.
 *
 * Accepted forms: `<branch>` (a branch or tag of cornerstonejs/cornerstone3D),
 * `<version>`, and `<branch> now <version>`. In the third form, the version is
 * a record of the release that the branch became, so `defer` tells the caller
 * to keep a pin that is the same or newer. A manual request
 * (`deferNow: false`) has no stored line to go stale, and does not defer.
 *
 * The grammar bars whitespace and newlines (which could add entries to
 * GITHUB_OUTPUT), a leading '-' or '.' (a flag), '..' and ':' (a fork).
 */
export function classify(rawValue, { deferNow = true } = {}) {
  const raw = rawValue.trim();
  if (!raw) return { kind: 'none', ref: '', history: '', defer: false };

  let history = '';
  let ref = raw;
  let defer = false;
  const now = raw.match(/^(.*\S)\s+now\s+(\S+)$/);
  if (now) {
    history = now[1];
    ref = now[2];
    defer = deferNow;
  }

  // The value comes from the PR body, which anyone can read, so quoting it
  // discloses nothing. Control characters go, and the length is capped, so
  // that the value cannot become a workflow command of its own.
  const shown = raw.replace(/[\x00-\x1f]/g, '').slice(0, 200);
  const reject = why => new Error(`Rejected the requested CS3D ref, read as: [${shown}]. ${why}`);
  const grammarOk = p => REF_GRAMMAR.test(p) && !p.includes('..');
  if (!grammarOk(ref) || (history && !grammarOk(history))) {
    throw reject(
      "Write it as one of: <branch>, <version>, or '<branch> now <version>'. Each part must start with a letter or digit, contain only letters, digits and the characters . _ / + - and contain no '..'. Forks cannot be named: give a branch or tag in cornerstonejs/cornerstone3D, or a published version."
    );
  }
  for (const part of [ref, ...(history ? history.split(/\s+/) : [])]) {
    if (!isLegalRefName(part)) {
      throw reject(
        "Git does not accept that ref name. Check for a trailing or doubled '/', a path component that starts with '.', or a '.lock' suffix."
      );
    }
  }
  if (history && !CONCRETE_VERSION.test(ref)) {
    throw reject(
      "The version after 'now' must be one concrete release, for example 5.10.6 or 5.11.0-beta.1, and not a range."
    );
  }

  let kind;
  if (VERSION_FORMS.test(ref)) kind = 'version';
  else if (/^[0-9][0-9.x+]*$/.test(ref)) {
    // Written only from the version alphabet, so a typed version, not a branch.
    throw reject(
      'It looks like a version, but it is not one of the accepted forms: 5.10.3, 5.11.0-beta.1, 5.x, 5.10.x or 4.19+. A two-part number such as 5.10 is not one of them. Write 5.10.x for the latest 5.10 release, or name the exact release.'
    );
  } else kind = 'branch';

  return { kind, ref, history, defer };
}

const SKIP_WHERE = {
  fence: 'inside a fenced code block',
  indent: 'indented by four spaces or more, which markdown reads as a code block',
  comment: 'inside an HTML comment',
};

/**
 * Reads the request of a PR body: parseBody, then classify. Returns the
 * classify result and a `warning` for a skipped line. Throws for a rejected
 * value, and for a skipped line in a block that the body never closes, because
 * that block can hide a real request and the merge guard would then report
 * all clear.
 */
export function readRef(body, { deferNow = true } = {}) {
  const parsed = parseBody(body);
  let warning = '';
  if (!parsed.raw && parsed.skip) {
    const { reason, line, value } = parsed.skip;
    const where = SKIP_WHERE[reason] || 'inside a quoted block';
    const shown = value.replace(/[\x00-\x1f]/g, '').slice(0, 200);
    if (parsed.unclosed) {
      throw new Error(
        `Line ${line} of the pull request body reads [CS3D_REF: ${shown}], ${where} that the body never closes. Close the block, or move the line out of it.`
      );
    }
    warning = `Ignored the CS3D_REF line on line ${line} of the pull request body, read as [CS3D_REF: ${shown}], because that line is ${where}. Move the line to the top level of the body if you meant it as a request.`;
  }
  return { ...classify(parsed.raw, { deferNow }), warning };
}

/**
 * True for a Netlify deploy preview build on Netlify's servers. A local
 * `netlify build` sets `NETLIFY_LOCAL` and has no `BUILD_ID`.
 */
export function isNetlifyDeployPreview(env = process.env) {
  return (
    env.NETLIFY === 'true' &&
    env.CONTEXT === 'deploy-preview' &&
    Boolean(env.BUILD_ID) &&
    !env.NETLIFY_LOCAL
  );
}

/**
 * Finds `owner/repo` and the pull request number from the CircleCI
 * environment, or from a Netlify deploy preview (`REVIEW_ID`,
 * `REPOSITORY_URL`). Returns null when this build is not for a pull request.
 */
export function findPullRequest(env = process.env) {
  const circle = (env.CIRCLE_PULL_REQUEST || '').match(/github\.com\/([^/]+\/[^/]+)\/pull\/(\d+)/);
  if (circle) {
    return { repo: circle[1], number: circle[2] };
  }
  const netlifyRepo = (env.REPOSITORY_URL || '').match(/github\.com[/:]([^/]+\/[^/]+?)(?:\.git)?\/?$/);
  if (isNetlifyDeployPreview(env) && /^\d+$/.test(env.REVIEW_ID || '') && netlifyRepo) {
    return { repo: netlifyRepo[1], number: env.REVIEW_ID };
  }
  return null;
}

/**
 * Reads the PR body through the GitHub API, with up to 3 retries for a
 * transient failure (a network error, 429 or 5xx).
 *
 * A 401 with a token means the token expired or was revoked. The request then
 * runs once more without the token, and a warning asks for a new token, so a
 * bad token is never worse than no token.
 *
 * The token goes in a request header, never on a command line, and a failure
 * reports only the HTTP status: a CI log must never show the token.
 */
export async function fetchBody({ repo, number }, { token = process.env.GITHUB_TOKEN } = {}) {
  const headers = { Accept: 'application/vnd.github+json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const url = `https://api.github.com/repos/${repo}/pulls/${number}`;
  let failure = '';
  for (let attempt = 0; attempt < 4; attempt++) {
    let response;
    try {
      response = await fetch(url, { headers, signal: AbortSignal.timeout(30_000) });
    } catch (error) {
      failure = `request failed (${error.name})`;
      continue;
    }
    if (response.ok) return (await response.json()).body || '';
    if (response.status === 401 && token) {
      report('warning', 'GitHub rejected GITHUB_TOKEN (HTTP 401). Replace the token. Retrying without it.');
      return fetchBody({ repo, number }, { token: '' });
    }
    failure = `HTTP ${response.status}`;
    if (response.status !== 429 && response.status < 500) break;
  }
  throw new Error(failure);
}

/** Prints a diagnostic on stderr, as a GitHub annotation under GitHub Actions. */
function report(level, message) {
  console.error(
    process.env.GITHUB_ACTIONS === 'true' ? `::${level}::${message}` : `[cs3d-read-ref] ${message}`
  );
}

async function main() {
  const out = (kind, ref = '', history = '', defer = false) =>
    console.log([kind, ref, history, defer].join('\n'));
  const bodyFileIndex = process.argv.indexOf('--body-file');
  const deferNow = !process.argv.includes('--no-defer');

  let body;
  if (bodyFileIndex > 0) {
    body = readFileSync(process.argv[bodyFileIndex + 1], 'utf8');
  } else {
    const pr = findPullRequest();
    if (!pr) {
      report('notice', 'This build is not for a pull request: no CS3D_REF to read.');
      return out('none');
    }
    try {
      body = await fetchBody(pr);
    } catch (error) {
      // A fork PR's deploy preview never gets the token, and Netlify's build
      // servers share their addresses, so the rate limit can hit any build.
      // Fall back to the pin rather than fail a PR with no CS3D_REF line.
      report(
        'warning',
        `Could not read the body of ${pr.repo}#${pr.number} (${error.message}), so this build uses the pinned CS3D version and ignores any CS3D_REF line. A PR that needs an unreleased CS3D change fails to build for that reason; retry the build later. Set a read-only GITHUB_TOKEN to avoid the GitHub API rate limit.`
      );
      return out('none');
    }
  }

  try {
    const { kind, ref, history, defer, warning } = readRef(body, { deferNow });
    if (warning) report('warning', warning);
    if (kind === 'none') report('notice', 'No CS3D ref requested.');
    else if (history) report('notice', `CS3D ref: ${ref} (${kind}; was branch ${history})`);
    else report('notice', `CS3D ref requested: ${ref} (${kind})`);
    out(kind, ref, history, defer);
  } catch (error) {
    report('error', error.message);
    process.exit(1);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
