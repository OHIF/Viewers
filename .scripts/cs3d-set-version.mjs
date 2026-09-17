#!/usr/bin/env node

/**
 * Updates all @cornerstonejs/* package versions across the OHIF workspace.
 *
 * Usage: node .scripts/cs3d-set-version.mjs <version> [--only-if-newer]
 *
 * Only updates the 8 main CS3D packages (not codec packages):
 *   adapters, ai, core, dicom-image-loader, labelmap-interpolation,
 *   nifti-volume-loader, polymorphic-segmentation, tools
 *
 * --only-if-newer
 *   Do nothing when the version already committed is the same as, or newer
 *   than, <version>. Used for the `CS3D_REF: <branch> now <version>` form,
 *   where the version is a record of what the branch became rather than a
 *   request — so a stale note cannot drag the pinned version backwards. An
 *   explicit request (a bare ref, or anything typed into the workflow_dispatch
 *   box) omits the flag and is obeyed as given, downgrades included.
 *
 * Reports whether anything changed, on stdout and — when GITHUB_OUTPUT is set —
 * as a `changed` step output. The caller needs this because rewriting the
 * manifests forces the following install to drop --frozen-lockfile; when
 * nothing changed, the frozen install already done earlier in the job stands
 * and no reinstall is needed at all.
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, appendFileSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import semver from 'semver';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

const args = process.argv.slice(2);
const onlyIfNewer = args.includes('--only-if-newer');
const version = args.find((a) => !a.startsWith('--'));
if (!version) {
  console.error('Usage: cs3d-set-version.mjs <version> [--only-if-newer]');
  console.error('  e.g. 5.10.3, 5.11.0-beta.1');
  process.exit(1);
}

if (!semver.valid(version)) {
  console.error(`"${version}" is not a concrete semver version.`);
  console.error('Ranges must be resolved first (see cs3d-resolve-version.mjs).');
  process.exit(1);
}

/** Tell the calling workflow step whether the manifests were rewritten. */
function reportChanged(changed) {
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `changed=${changed}\n`);
  }
}

// The 8 CS3D packages that are built from source (not codecs)
const CS3D_PACKAGES = [
  '@cornerstonejs/adapters',
  '@cornerstonejs/ai',
  '@cornerstonejs/core',
  '@cornerstonejs/dicom-image-loader',
  '@cornerstonejs/labelmap-interpolation',
  '@cornerstonejs/nifti-volume-loader',
  '@cornerstonejs/polymorphic-segmentation',
  '@cornerstonejs/tools',
];

// Read root package.json to get workspace globs
const rootPkgPath = resolve(rootDir, 'package.json');
const rootPkg = JSON.parse(readFileSync(rootPkgPath, 'utf8'));
const workspaceGlobs = rootPkg.workspaces?.packages || rootPkg.workspaces || [];

// Collect all package.json paths from workspace globs
function findWorkspacePackageJsons() {
  const paths = [rootPkgPath]; // include root

  for (const pattern of workspaceGlobs) {
    const parts = pattern.split('/');
    let searchDir = rootDir;
    let hasWildcard = false;

    for (const part of parts) {
      if (part === '*') {
        hasWildcard = true;
        break;
      }
      searchDir = join(searchDir, part);
    }

    if (hasWildcard) {
      try {
        const entries = readdirSync(searchDir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory()) {
            const pkgJson = join(searchDir, entry.name, 'package.json');
            if (existsSync(pkgJson)) {
              paths.push(pkgJson);
            }
          }
        }
      } catch {
        // directory doesn't exist, skip
      }
    } else {
      const pkgJson = join(rootDir, pattern, 'package.json');
      if (existsSync(pkgJson)) {
        paths.push(pkgJson);
      }
    }
  }

  return paths;
}

// Update a dependencies object, returning count of changes
function updateDeps(deps, targetVersion) {
  let count = 0;
  if (!deps) return count;
  for (const pkg of CS3D_PACKAGES) {
    if (pkg in deps && deps[pkg] !== targetVersion) {
      deps[pkg] = targetVersion;
      count++;
    }
  }
  return count;
}

const pkgPaths = findWorkspacePackageJsons();

/**
 * The version currently committed, read from the first CS3D dependency found.
 * The workspace keeps these in step (every occurrence carries the same value),
 * so any one of them answers the question.
 */
function committedVersion() {
  for (const pkgPath of pkgPaths) {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
    for (const deps of [pkg.dependencies, pkg.devDependencies, pkg.peerDependencies, pkg.resolutions]) {
      if (!deps) continue;
      for (const name of CS3D_PACKAGES) {
        if (name in deps && semver.valid(deps[name])) return deps[name];
      }
    }
  }
  return null;
}

const committed = committedVersion();

if (committed && semver.eq(committed, version)) {
  console.log(`@cornerstonejs/* already pinned at ${version}; nothing to change.`);
  reportChanged(false);
  process.exit(0);
}

if (onlyIfNewer && committed && semver.gt(committed, version)) {
  console.log(
    `@cornerstonejs/* is pinned at ${committed}, which is newer than the recorded ${version}.\n` +
      'Keeping the committed version: a "now" clause records what a branch became, so it never ' +
      'moves the pin backwards. Use a bare CS3D_REF to request an older version deliberately.'
  );
  reportChanged(false);
  process.exit(0);
}

if (committed && semver.lt(version, committed)) {
  // Reached only without --only-if-newer, i.e. someone asked for this outright.
  console.log(
    `::warning::Requested ${version} is older than the committed ${committed}; downgrading as requested.`
  );
}

let totalChanges = 0;

for (const pkgPath of pkgPaths) {
  const content = readFileSync(pkgPath, 'utf8');
  const pkg = JSON.parse(content);
  let changes = 0;

  changes += updateDeps(pkg.dependencies, version);
  changes += updateDeps(pkg.devDependencies, version);
  changes += updateDeps(pkg.peerDependencies, version);
  changes += updateDeps(pkg.resolutions, version);

  if (changes > 0) {
    // Preserve original formatting (detect indent — restrict to spaces/tabs so
    // we don't accidentally capture a CRLF newline as part of the indent string)
    const indent = content.match(/^([ \t]+)/m)?.[1] || '  ';
    writeFileSync(pkgPath, JSON.stringify(pkg, null, indent) + '\n');
    const rel = pkgPath.replace(rootDir + '/', '').replace(rootDir + '\\', '');
    console.log(`  Updated ${rel} (${changes} packages)`);
    totalChanges += changes;
  }
}

console.log(
  `\nDone: ${totalChanges} version(s) updated to ${version} across ${pkgPaths.length} package files.`
);
reportChanged(totalChanges > 0);
console.log(
  'This rewrites package.json, so the lockfile no longer matches it and the next install cannot ' +
    'be frozen. In CI the workflow handles that. Locally, run `pnpm run install:update-lockfile` ' +
    '(pnpm install --no-frozen-lockfile) when you intend to commit the lockfile update.\n'
);
