#!/usr/bin/env node

/**
 * Resolves a version pattern to a concrete npm version of @cornerstonejs/core.
 *
 * Patterns:
 * 4.18.2         -> 4.18.2 (exact, returned as-is)
 * 4.18.2-beta.3  -> 4.18.2-beta.3 (exact prerelease)
 * 4.x            -> latest 4.* from npm
 * 4.17.x         -> latest 4.17.* from npm
 * 4.19+          -> latest >=4.19.0 <5.0.0-0 from npm (4.19 and later, same major)
 *
 * Prints the resolved version to stdout.
 */

import { execSync } from 'child_process';

const pattern = process.argv[2];
if (!pattern) {
  console.error('Usage: cs3d-resolve-version.mjs <pattern>');
  console.error(' e.g. 4.x, 4.17.x, 4.19+, 4.18.2, 4.18.2-beta.3');
  process.exit(1);
}

// Exact version (no wildcard or range) — pass through unchanged
if (!pattern.includes('x') && !pattern.endsWith('+')) {
  console.log(pattern);
  process.exit(0);
}

// Convert "M.m+" to npm semver range ">=M.m.0 <(M+1).0.0-0"
let npmRange = pattern;
const plusMatch = pattern.match(/^(\d+)\.(\d+)\+$/);
if (plusMatch) {
  const major = Number(plusMatch[1]);
  const minor = Number(plusMatch[2]);
  npmRange = `>=${major}.${minor}.0 <${major + 1}.0.0-0`;
}

try {
  // Let npm resolve the range: @package@<range> → concrete version
  const raw = execSync(`npm view @cornerstonejs/core@"${npmRange}" version --json`, {
    encoding: 'utf8',
    timeout: 30_000,
  });

  const resolved = JSON.parse(raw);
  if (!resolved) {
    console.error(`npm returned no version when resolving @cornerstonejs/core@${npmRange}`);
    process.exit(1);
  }

  // npm may return an array of versions for ranges; pick the latest (last) one
  const version = Array.isArray(resolved) ? resolved[resolved.length - 1] : resolved;
  console.log(version);
} catch (err) {
  const message =
    (err && (err.stderr?.toString() || err.message || String(err))) ||
    `Unknown error resolving @cornerstonejs/core@${pattern}`;
  console.error(`Failed to resolve @cornerstonejs/core version for pattern "${pattern}":`);
  console.error(message);
  process.exit(1);
}
