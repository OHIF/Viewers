#!/usr/bin/env node

/**
 * Creates the GitHub Release for an OHIF version tag.
 *
 * Usage: create-github-release.mjs <tag> [--dry-run]
 *   e.g. create-github-release.mjs v3.14.0-beta.37 --dry-run
 *
 * Rules:
 * - Only tags of the form vX.Y.Z or vX.Y.Z-<prerelease> are accepted.
 * - If a release (or draft) already exists for the tag, it is left untouched
 *   and the script exits successfully, so hand-edited notes are never overwritten.
 * - The release is only created once @ohif/app is on npm at that version. It is
 *   the last package publish-package.mjs publishes, so the rest are on npm by
 *   then. This wait is temporary, until npm publishing moves to GitHub Actions.
 * - A prerelease version (e.g. a beta) is marked as a pre-release and is never
 *   "Latest". A stable version is marked "Latest" only if it is the highest
 *   stable version among all tags, so a 3.12.x patch never takes Latest from 3.13.x.
 * - Notes are GitHub generated. They count from the nearest earlier tag
 *   reachable from this one, except for a minor release (X.Y.0), which counts
 *   from the previous minor release so the notes cover the whole release.
 * - A minor release (X.Y.0) is created as a draft, because it usually gets
 *   hand-written notes. An issue is opened, assigned to the owners of /.github/
 *   in .github/CODEOWNERS, asking them to review and publish it.
 *
 * --dry-run makes no changes: it checks npm once instead of waiting and prints
 * what would be created, even for a tag that already has a release.
 *
 * Environment:
 *   GITHUB_TOKEN          token with contents: write and issues: write
 *                         (read is enough for --dry-run)
 *   GITHUB_REPOSITORY     owner/repo, defaults to OHIF/Viewers
 *   NPM_WAIT_MINUTES      how long to wait for npm, defaults to 60
 *   NPM_POLL_SECONDS      how often to check npm, defaults to 30
 */

import { execFileSync } from 'child_process';
import fs from 'fs';

const TAG_PATTERN = /^v(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/;
const NPM_PACKAGE = '@ohif/app';
const CODEOWNERS_PATH = '.github/CODEOWNERS';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const tag = args.find(arg => !arg.startsWith('--'));

const repository = process.env.GITHUB_REPOSITORY || 'OHIF/Viewers';
const token = process.env.GITHUB_TOKEN;
const npmWaitMinutes = Number(process.env.NPM_WAIT_MINUTES || 60);
const npmPollSeconds = Number(process.env.NPM_POLL_SECONDS || 30);

function git(...gitArgs) {
  return execFileSync('git', gitArgs, { encoding: 'utf8' }).trim();
}

function parseVersion(tagName) {
  const match = tagName.match(TAG_PATTERN);
  if (!match) {
    return null;
  }
  return {
    tagName,
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4] || null,
  };
}

// Compares stable versions only; prereleases never take part in these decisions.
function compareStable(a, b) {
  return a.major - b.major || a.minor - b.minor || a.patch - b.patch;
}

function getStableVersions() {
  return git('tag', '--list', 'v*')
    .split('\n')
    .map(parseVersion)
    .filter(parsed => parsed && !parsed.prerelease);
}

async function github(method, path, body) {
  const response = await fetch(`https://api.github.com/repos/${repository}${path}`, {
    method,
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  return { status: response.status, data: text ? JSON.parse(text) : null };
}

// Drafts are not returned by /releases/tags/{tag}, so look through the release
// list as well, or a re-run would create a second draft and a second issue.
async function findExistingRelease() {
  const published = await github('GET', `/releases/tags/${encodeURIComponent(tag)}`);
  if (published.status === 200) {
    return published.data;
  }
  if (published.status !== 404) {
    throw new Error(`Could not check for an existing release: HTTP ${published.status}`);
  }

  const recent = await github('GET', '/releases?per_page=100');
  if (recent.status !== 200) {
    throw new Error(`Could not list releases: HTTP ${recent.status}`);
  }
  return recent.data.find(release => release.tag_name === tag) ?? null;
}

async function isOnNpm(version) {
  const url = `https://registry.npmjs.org/${NPM_PACKAGE.replace('/', '%2F')}/${version}`;
  try {
    const response = await fetch(url);
    return response.status === 200;
  } catch (error) {
    console.warn(`Could not reach npm: ${error.message}`);
    return false;
  }
}

async function waitForNpm(version) {
  const deadline = Date.now() + npmWaitMinutes * 60_000;

  while (!(await isOnNpm(version))) {
    if (dryRun) {
      console.log(`Dry run: ${NPM_PACKAGE}@${version} is not on npm yet.`);
      return;
    }
    if (Date.now() >= deadline) {
      throw new Error(
        `Gave up after ${npmWaitMinutes} minutes: ${NPM_PACKAGE}@${version} is not on npm.`
      );
    }
    console.log(`Waiting for ${NPM_PACKAGE}@${version} on npm...`);
    await new Promise(resolve => setTimeout(resolve, npmPollSeconds * 1000));
  }
  console.log(`${NPM_PACKAGE}@${version} is on npm.`);
}

function getPreviousTag(version, isMinorRelease) {
  if (isMinorRelease) {
    // The highest earlier X.Y.0, e.g. v3.13.0 for v3.14.0 and v3.x.0 for v4.0.0.
    const previousMinor = getStableVersions()
      .filter(other => other.patch === 0 && compareStable(other, version) < 0)
      .sort(compareStable)
      .pop();
    return previousMinor?.tagName ?? null;
  }
  // The nearest version tag in this branch's history before this one:
  // `${tag}^` starts from the parent commit, --abbrev=0 prints just the tag name.
  // Throws when there is no earlier tag.
  try {
    return git('describe', '--tags', '--abbrev=0', '--match', 'v[0-9]*', `${tag}^`);
  } catch {
    return null;
  }
}

function isHighestStable(version) {
  return getStableVersions().every(other => compareStable(version, other) >= 0);
}

// The individual owners of /.github/ in CODEOWNERS (teams cannot be assigned).
function getReleaseOwners() {
  const line = fs
    .readFileSync(CODEOWNERS_PATH, 'utf8')
    .split('\n')
    .find(entry => entry.trim().split(/\s+/)[0] === '/.github/');

  return (line?.match(/@[\w-]+(?![\w/-])/g) ?? []).map(owner => owner.slice(1));
}

async function openReviewIssue(draftUrl, makeLatest) {
  const owners = getReleaseOwners();
  const latestStep = makeLatest
    ? '2. Under **Release label**, keep **Latest** selected.'
    : '2. Under **Release label**, choose **None**, not Latest: a higher stable version exists.';
  const issue = {
    title: `Review and publish the ${tag} release`,
    body: [
      `The ${tag} release was created as a draft: ${draftUrl}`,
      '',
      'Minor releases usually get hand-written notes, so it is not public yet. To publish it:',
      '',
      '1. Open the draft and review the generated notes. Add a summary or a link to the release notes on ohif.org if needed.',
      latestStep,
      '3. Click **Publish release**, then close this issue.',
      '',
      owners.map(owner => `@${owner}`).join(' '),
    ].join('\n'),
  };

  if (dryRun) {
    console.log(`Dry run: would open an issue assigned to ${owners.join(', ') || '(nobody)'}:`);
    console.log(`\n${issue.title}\n\n${issue.body}\n`);
    return;
  }

  let created = await github('POST', '/issues', { ...issue, assignees: owners });
  if (created.status === 422) {
    // An owner who can no longer be assigned; the mentions still notify everyone.
    console.warn('Could not assign the owners, opening the issue without assignees.');
    created = await github('POST', '/issues', issue);
  }
  if (created.status !== 201) {
    throw new Error(
      `Created the draft, but could not open the review issue: HTTP ${created.status} ${created.data?.message ?? ''}`
    );
  }
  console.log(`Opened ${created.data.html_url}`);
}

async function run() {
  if (!tag) {
    throw new Error('Usage: create-github-release.mjs <tag> [--dry-run]');
  }

  const version = parseVersion(tag);
  if (!version) {
    throw new Error(`"${tag}" is not a version tag (expected vX.Y.Z or vX.Y.Z-<prerelease>).`);
  }

  try {
    git('rev-parse', '--verify', '--quiet', `refs/tags/${tag}`);
  } catch {
    throw new Error(`Tag ${tag} does not exist in this checkout.`);
  }

  const existing = await findExistingRelease();
  if (existing) {
    const kind = existing.draft ? 'A draft release' : 'A release';
    if (!dryRun) {
      console.log(`${kind} for ${tag} already exists (${existing.html_url}). Leaving it unchanged.`);
      return;
    }
    // Keep previewing, so dry runs still exercise the logic for released tags.
    console.log(`${kind} for ${tag} already exists (${existing.html_url}).`);
    console.log('A real run would stop here. Previewing what would be created anyway:');
  }

  const packageVersion = tag.slice(1);
  await waitForNpm(packageVersion);

  const prerelease = Boolean(version.prerelease);
  const isMinorRelease = !prerelease && version.patch === 0;
  const makeLatest = !prerelease && isHighestStable(version);
  const previousTag = getPreviousTag(version, isMinorRelease);

  const notes = await github('POST', '/releases/generate-notes', {
    tag_name: tag,
    ...(previousTag ? { previous_tag_name: previousTag } : {}),
  });
  if (notes.status !== 200) {
    const message = `Could not generate release notes: HTTP ${notes.status} ${notes.data?.message ?? ''}`;
    if (!dryRun) {
      throw new Error(message);
    }
    console.warn(`Dry run: ${message}`);
  }

  // A draft cannot be Latest; the maintainer sets it when publishing.
  const release = {
    tag_name: tag,
    name: tag,
    body: notes.data?.body ?? '',
    draft: isMinorRelease,
    prerelease,
    ...(isMinorRelease ? {} : { make_latest: makeLatest ? 'true' : 'false' }),
  };

  console.log(`Tag:          ${tag}`);
  console.log(`Previous tag: ${previousTag ?? '(none)'}`);
  console.log(`Draft:        ${release.draft}`);
  console.log(`Pre-release:  ${prerelease}`);
  console.log(`Latest:       ${makeLatest}`);

  if (dryRun) {
    console.log(`Dry run: would create this release. Notes:\n\n${release.body}\n`);
    if (release.draft) {
      await openReviewIssue('(the new draft)', makeLatest);
    }
    return;
  }

  const created = await github('POST', '/releases', release);
  if (created.status === 201) {
    console.log(`Created ${created.data.html_url}`);
    if (release.draft) {
      await openReviewIssue(created.data.html_url, makeLatest);
    }
    return;
  }
  // Another run created it between our check and now.
  const alreadyExists = created.data?.errors?.some(error => error.code === 'already_exists');
  if (created.status === 422 && alreadyExists) {
    console.log(`A release for ${tag} was created by another run. Leaving it unchanged.`);
    return;
  }
  throw new Error(
    `Could not create the release: HTTP ${created.status} ${created.data?.message ?? ''}`
  );
}

run().catch(error => {
  console.error(error.message);
  process.exit(1);
});
