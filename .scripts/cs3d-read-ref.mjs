#!/usr/bin/env node

/**
 * Reads the `CS3D_REF:` line of a pull request body, for the CI systems that
 * are not GitHub Actions: the CircleCI unit test and Cypress jobs, and the
 * Netlify deploy preview.
 *
 * Usage:
 *   node .scripts/cs3d-read-ref.mjs              find the PR from the CI environment
 *   node .scripts/cs3d-read-ref.mjs --body-file <file>   parse a saved body (tests)
 *
 * Prints four lines on stdout: <kind>, <ref>, <history>, <defer>. The kind is
 * `none`, `version` or `branch`. An empty value is an empty line; one value per
 * line keeps an empty field in place, which a tab-separated line does not
 * under bash `read`. Diagnostics go to stderr.
 *
 * The rules are a copy of the `gate` job in .github/workflows/playwright.yml,
 * and the two copies must agree. The gate keeps its copy inline on purpose: it
 * runs before any code from the pull request, so it cannot run this file. The
 * jobs that use this file already run the code of the pull request, so a
 * script from the checkout adds no new trust. When you change a rule, change
 * it in both places, and run `node --test .scripts/cs3d-read-ref.test.mjs`.
 *
 * Difference from the gate, on purpose: when the body cannot be read (no PR,
 * a GitHub API rate limit, a network fault), this script reports `none` with a
 * warning, and the job runs the ordinary suite. The gate fails instead,
 * because it also decides approval and feeds the merge guard. Neither
 * decision happens here, and a failure here would stop every pull request
 * whenever the shared CI address reaches the unauthenticated rate limit.
 * Set GITHUB_TOKEN (read-only) in the CI settings to avoid that limit.
 */

import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

/** Parses a body the same way as the awk parser of the gate. */
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

  let fence = '';
  let flen = 0;
  let comment = false;
  let openSkip = false;
  // awk splits records on "\n" only; the gate then strips one trailing "\r".
  // A body that ends in "\n" has no empty last record in awk.
  const lines = body.split('\n');
  if (lines.length && lines[lines.length - 1] === '') lines.pop();

  for (let i = 0; i < lines.length; i++) {
    const lineNo = i + 1;
    const line = lines[i].replace(/\r$/, '');

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
      result.raw = text
        .replace(/^CS3D_REF:[ \t]*/, '')
        .replace(/[ \t\r]+$/, '')
        .replace(/\t/g, ' ');
      // The gate reports skips seen before the live line, but it acts on
      // them only when no live line exists, so they are dropped here.
      result.skip = null;
      return result;
    }
  }

  if ((fence !== '' || comment) && openSkip) result.unclosed = true;
  return result;
}

const REF_GRAMMAR = /^[A-Za-z0-9][A-Za-z0-9._/+-]*$/;
const CONCRETE_VERSION = /^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?$/;
const VERSION_FORMS = /^[0-9]+(\.[0-9]+(\.([0-9]+(-[0-9A-Za-z.-]+)?|x)|\+)|\.x)$/;

/** The shape rules of `git check-ref-format refs/heads/<part>`, for the grammar above. */
function isLegalRefName(part) {
  if (part.endsWith('/') || part.includes('//')) return false;
  if (part.endsWith('.') || part.endsWith('.lock')) return false;
  return part.split('/').every(c => c !== '' && !c.startsWith('.') && !c.endsWith('.lock'));
}

/**
 * Validates and classifies the raw value, as sections 2 to 4 of the gate do.
 * Throws an Error with the message that the gate prints when it rejects a ref.
 */
export function classify(rawValue, { isPullRequest = true } = {}) {
  const raw = rawValue.trim();
  if (!raw) return { kind: 'none', ref: '', history: '', defer: false };

  let history = '';
  let ref = raw;
  let defer = false;
  const now = raw.match(/^(.*\S)\s+now\s+(\S+)$/);
  if (now) {
    history = now[1];
    ref = now[2];
    defer = isPullRequest;
  }

  const shown = raw.replace(/[\x00-\x1f]/g, '').slice(0, 200);
  const grammarOk = p => REF_GRAMMAR.test(p) && !p.includes('..');
  if (!grammarOk(ref) || (history && !grammarOk(history))) {
    throw new Error(
      `Rejected the requested CS3D ref, read as: [${shown}]. Write it as one of: <branch>, <version>, or '<branch> now <version>'.`
    );
  }
  // The gate runs `git check-ref-format` on the ref and on each word of the
  // history, so a history with a space in it cannot pass there either.
  for (const part of [ref, ...(history ? history.split(/\s+/) : [])]) {
    if (!isLegalRefName(part)) {
      throw new Error(
        `Rejected the requested CS3D ref, read as: [${shown}]. Git does not accept that ref name.`
      );
    }
  }
  if (history && !CONCRETE_VERSION.test(ref)) {
    throw new Error(
      `Rejected the requested CS3D ref, read as: [${shown}]. The version after 'now' must be one concrete release.`
    );
  }

  let kind;
  if (VERSION_FORMS.test(ref)) kind = 'version';
  else if (/^[0-9][0-9.x+]*$/.test(ref)) {
    throw new Error(
      `Rejected the requested CS3D ref, read as: [${shown}]. It looks like a version, but it is not one of the accepted forms: 5.10.3, 5.11.0-beta.1, 5.x, 5.10.x or 4.19+.`
    );
  } else kind = 'branch';

  return { kind, ref, history, defer };
}

/**
 * Finds `owner/repo` and the pull request number from the CI environment.
 * Returns null when this build is not for a pull request.
 */
export function findPullRequest(env = process.env) {
  // CircleCI: the URL of the PR, set when the branch has an open PR.
  const circle = (env.CIRCLE_PULL_REQUEST || '').match(/github\.com\/([^/]+\/[^/]+)\/pull\/(\d+)/);
  if (circle) return { repo: circle[1], number: circle[2] };

  // Netlify: a deploy preview sets PULL_REQUEST=true and REVIEW_ID.
  if (env.PULL_REQUEST === 'true' && /^\d+$/.test(env.REVIEW_ID || '')) {
    const repo = (env.REPOSITORY_URL || '').match(/github\.com[/:]([^/]+\/[^/.]+)/);
    return { repo: repo ? repo[1] : 'OHIF/Viewers', number: env.REVIEW_ID };
  }
  return null;
}

function fetchBody({ repo, number }) {
  const args = [
    '-fsSL',
    '--retry',
    '3',
    '--max-time',
    '30',
    '-H',
    'Accept: application/vnd.github+json',
  ];
  if (process.env.GITHUB_TOKEN) {
    args.push('-H', `Authorization: Bearer ${process.env.GITHUB_TOKEN}`);
  }
  args.push(`https://api.github.com/repos/${repo}/pulls/${number}`);
  const json = execFileSync('curl', args, { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  return JSON.parse(json).body || '';
}

function main() {
  const out = (kind, ref = '', history = '', defer = false) =>
    console.log([kind, ref, history, defer].join('\n'));
  const bodyFileIndex = process.argv.indexOf('--body-file');

  let body;
  if (bodyFileIndex > 0) {
    body = readFileSync(process.argv[bodyFileIndex + 1], 'utf8');
  } else {
    const pr = findPullRequest();
    if (!pr) {
      console.error('[cs3d-read-ref] This build is not for a pull request: no CS3D_REF to read.');
      return out('none');
    }
    try {
      body = fetchBody(pr);
    } catch (error) {
      console.error(
        `[cs3d-read-ref] WARNING: could not read the body of ${pr.repo}#${pr.number}, so this ` +
          'job cannot see a CS3D_REF line. The job runs against the pinned CS3D version. ' +
          'Set GITHUB_TOKEN in the CI settings if the cause is the API rate limit.'
      );
      console.error(String(error.message || error));
      return out('none');
    }
  }

  const parsed = parseBody(body);
  if (!parsed.raw && parsed.skip) {
    const { reason, line, value } = parsed.skip;
    const where =
      {
        fence: 'inside a fenced code block',
        indent: 'indented as a code block',
        comment: 'inside an HTML comment',
      }[reason] || 'inside a quoted block';
    const shown = value.replace(/[\x00-\x1f]/g, '').slice(0, 200);
    if (parsed.unclosed) {
      console.error(
        `[cs3d-read-ref] Line ${line} reads [CS3D_REF: ${shown}], ${where} that the body never closes. Close the block, or move the line out of it.`
      );
      process.exit(1);
    }
    console.error(
      `[cs3d-read-ref] Ignored the CS3D_REF line on line ${line}, because it is ${where}.`
    );
  }

  try {
    const { kind, ref, history, defer } = classify(parsed.raw);
    if (kind !== 'none') {
      console.error(
        `[cs3d-read-ref] CS3D ref requested: ${ref} (${kind}${history ? `; was branch ${history}` : ''})`
      );
    }
    out(kind, ref, history, defer);
  } catch (error) {
    console.error(`[cs3d-read-ref] ${error.message}`);
    process.exit(1);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
