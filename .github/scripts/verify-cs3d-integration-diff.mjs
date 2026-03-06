#!/usr/bin/env node
/**
 * Verifies that the current git diff (staged + unstaged) only contains allowed
 * changes for a CS3D integration branch. In integration-only mode: only
 * package manifests (package.json), lockfiles, and the metadata file may
 * change. In paired-change mode: those plus any other source files are allowed,
 * but CS3D dependency refs must still point only to trusted release asset URLs.
 *
 * Usage: node verify-cs3d-integration-diff.mjs [--mode integration-only|paired-change] [--metadata .github/cs3d-integration.json]
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

const ALLOWED_PACKAGE_GLOBS = [
  '**/package.json',
];
const LOCKFILE_NAMES = ['yarn.lock', 'package-lock.json', 'bun.lock'];
const METADATA_FILENAME = '.github/cs3d-integration.json';

/** Trusted CS3D repo (owner/repo) for release asset URLs. Override with CS3D_TRUSTED_REPO env. */
const DEFAULT_TRUSTED_REPO = 'cornerstonejs/cornerstone3D';

function getAllowedPaths(mode, metadataPath) {
  const allowed = new Set();
  for (const g of ALLOWED_PACKAGE_GLOBS) allowed.add(g);
  for (const lock of LOCKFILE_NAMES) allowed.add(lock);
  allowed.add(metadataPath || METADATA_FILENAME);
  return allowed;
}

/** True if path p is allowed by the set (glob-like: **/package.json, yarn.lock, etc.). */
function pathAllowed(p, allowedSet) {
  const norm = p.replace(/\\/g, '/');
  if (allowedSet.has(norm)) return true;
  for (const a of allowedSet) {
    if (a.endsWith('**/package.json') && norm.endsWith('package.json')) return true;
    if (a === 'yarn.lock' && (norm === 'yarn.lock' || norm.endsWith('/yarn.lock'))) return true;
    if (a === 'package-lock.json' && norm.endsWith('package-lock.json')) return true;
    if (a === 'bun.lock' && norm.endsWith('bun.lock')) return true;
    if (a === METADATA_FILENAME && norm.endsWith(METADATA_FILENAME)) return true;
  }
  return false;
}

function getChangedFiles() {
  try {
    const out = execSync('git diff --name-only HEAD', { cwd: ROOT, encoding: 'utf-8' });
    const staged = execSync('git diff --name-only --cached', { cwd: ROOT, encoding: 'utf-8' });
    const combined = new Set([...out.trim().split(/\n/).filter(Boolean), ...staged.trim().split(/\n/).filter(Boolean)]);
    return [...combined];
  } catch {
    return [];
  }
}

/** Returns list of @cornerstonejs refs that are not trusted tarball URLs. */
function checkPackageJsonTrusted(filePath, trustedRepo) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const obj = JSON.parse(content);
  const bad = [];
  const trustedPrefix = `https://github.com/${trustedRepo}/releases/download/`;

  function check(obj) {
    if (!obj || typeof obj !== 'object') return;
    for (const [key, value] of Object.entries(obj)) {
      if (key.startsWith('@cornerstonejs/') && typeof value === 'string') {
        if (value.startsWith('http') && !value.startsWith(trustedPrefix)) {
          bad.push({ file: filePath, pkg: key, value });
        }
      }
      if (typeof value === 'object' && key !== 'scripts') check(value);
    }
  }
  check(obj);
  return bad;
}

async function main() {
  const args = process.argv.slice(2);
  let mode = 'integration-only';
  let metadataPath = METADATA_FILENAME;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--mode' && args[i + 1]) { mode = args[++i]; continue; }
    if (args[i] === '--metadata' && args[i + 1]) { metadataPath = args[++i]; continue; }
  }

  const trustedRepo = process.env.CS3D_TRUSTED_REPO || DEFAULT_TRUSTED_REPO;
  const allowedSet = getAllowedPaths(mode, metadataPath);
  const changed = getChangedFiles();

  const disallowed = changed.filter((p) => !pathAllowed(p, allowedSet));
  const strictMode = mode === 'integration-only';

  if (strictMode && disallowed.length > 0) {
    console.error('Integration-only mode: only package manifests, lockfiles, and metadata may change.');
    console.error('The following files changed but are not allowed:');
    disallowed.forEach((f) => console.error('  -', f));
    process.exit(1);
  }

  const packageJsonFiles = changed.filter((f) => f.endsWith('package.json'));
  const violations = [];
  for (const rel of packageJsonFiles) {
    const full = path.join(ROOT, rel);
    try {
      const bad = checkPackageJsonTrusted(full, trustedRepo);
      violations.push(...bad.map((v) => ({ ...v, file: rel })));
    } catch (e) {
      violations.push({ file: rel, error: e.message });
    }
  }

  if (violations.length > 0) {
    console.error('CS3D dependency URLs must point only to trusted release assets from', trustedRepo);
    violations.forEach((v) => {
      if (v.pkg) console.error('  ', v.file, v.pkg, '->', v.value);
      else console.error('  ', v.file, v.error);
    });
    process.exit(1);
  }

  console.log('Diff verification passed.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
