#!/usr/bin/env node

/**
 * Resolves a version pattern to a concrete npm version of @cornerstonejs/core.
 *
 * Patterns:
 *   4.18.2          -> 4.18.2  (exact, returned as-is)
 *   4.18.2-beta.3   -> 4.18.2-beta.3  (exact prerelease)
 *   4.x             -> latest 4.*.* release
 *   4.17.x          -> latest 4.17.* release
 *
 * Prints the resolved version to stdout.
 */

import { execSync } from 'child_process';

const pattern = process.argv[2];
if (!pattern) {
  console.error('Usage: cs3d-resolve-version.mjs <pattern>');
  console.error('  e.g. 4.x, 4.17.x, 4.18.2, 4.18.2-beta.3');
  process.exit(1);
}

if (!pattern.includes('x')) {
  // Exact version — pass through
  console.log(pattern);
  process.exit(0);
}

// Build regex from pattern: replace 'x' with \d+ for matching
const regexStr =
  '^' +
  pattern
    .replace(/\./g, '\\.')
    .replace(/x/g, '\\d+') +
  '$';
const regex = new RegExp(regexStr);

// Query npm for all published versions
const raw = execSync('npm view @cornerstonejs/core versions --json', {
  encoding: 'utf8',
  timeout: 30_000,
});
const versions = JSON.parse(raw);

const matches = versions.filter((v) => regex.test(v));

if (matches.length === 0) {
  console.error(`No @cornerstonejs/core version matches pattern "${pattern}"`);
  process.exit(1);
}

// Sort by semver — npm returns in publish order which is usually semver order,
// but we sort explicitly to be safe. Simple numeric comparison per segment.
matches.sort((a, b) => {
  const pa = a.split(/[-.]/).map((s) => (/^\d+$/.test(s) ? Number(s) : s));
  const pb = b.split(/[-.]/).map((s) => (/^\d+$/.test(s) ? Number(s) : s));
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const sa = pa[i] ?? '';
    const sb = pb[i] ?? '';
    if (typeof sa === 'number' && typeof sb === 'number') {
      if (sa !== sb) return sa - sb;
    } else {
      const cmp = String(sa).localeCompare(String(sb));
      if (cmp !== 0) return cmp;
    }
  }
  return 0;
});

// Pick the highest non-prerelease version if available, otherwise highest overall
const stableMatches = matches.filter((v) => !v.includes('-'));
const resolved = stableMatches.length > 0
  ? stableMatches[stableMatches.length - 1]
  : matches[matches.length - 1];

console.log(resolved);
