#!/usr/bin/env node
/**
 * Resolves the latest CS3D prerelease for a given PR URL, updates local
 * @cornerstonejs/* deps to those tarballs, then runs install:update-lockfile.
 * Fails if no matching release exists.
 *
 * Usage: bun run install:cs3d <PR_URL>
 * Example: bun run install:cs3d https://github.com/cornerstonejs/cornerstone3D/pull/2648
 *
 * Requires GH_TOKEN or GITHUB_TOKEN for the GitHub API.
 */

import { execa } from 'execa';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const PR_URL_RE = /^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)\/?$/i;

function parsePrUrl(url) {
  const m = (url || '').trim().match(PR_URL_RE);
  if (!m) {
    console.error('Expected a GitHub PR URL, e.g. https://github.com/cornerstonejs/cornerstone3D/pull/2648');
    process.exit(1);
  }
  return { owner: m[1], repo: m[2], prNumber: m[3] };
}

async function fetchLatestReleaseForPr(owner, repo, prNumber, token) {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/releases?per_page=100`,
    { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json' } }
  );
  if (!res.ok) {
    throw new Error(`GitHub API failed: ${res.status} ${await res.text()}`);
  }
  const releases = await res.json();
  const prefix = `cs3d-pr-${prNumber}-`;
  const matches = releases.filter((r) => r.tag_name && r.tag_name.startsWith(prefix));
  if (matches.length === 0) {
    console.error(`No release found for PR #${prNumber} (expected a tag like ${prefix}<short-sha>).`);
    console.error('Ensure the CS3D PR has the ohif-integration label and the integration workflow has run.');
    process.exit(1);
  }
  matches.sort((a, b) => new Date(b.published_at || b.created_at) - new Date(a.published_at || a.created_at));
  return matches[0];
}

async function main() {
  const prUrl = process.argv[2];
  const { owner, repo, prNumber } = parsePrUrl(prUrl);
  const ownerRepo = `${owner}/${repo}`;

  const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
  if (!token) {
    console.error('GH_TOKEN or GITHUB_TOKEN is required to fetch release info.');
    process.exit(1);
  }

  const release = await fetchLatestReleaseForPr(owner, repo, prNumber, token);
  const tag = release.tag_name;
  console.log('Using release:', tag);

  const updateScript = path.join(ROOT, '.github', 'scripts', 'update-cs3d-deps-from-assets.mjs');
  await execa('node', [
    updateScript,
    '--release-tag', tag,
    '--repo', ownerRepo,
    '--mode', 'integration-only',
    '--cs3d-pr', prNumber,
  ], { cwd: ROOT, stdio: 'inherit', env: { ...process.env, GH_TOKEN: token } });

  console.log('Updating lockfile...');
  await execa('bun', ['run', 'install:update-lockfile'], { cwd: ROOT, stdio: 'inherit' });
  console.log('Done. CS3D deps point at', tag);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
