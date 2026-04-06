#!/usr/bin/env node

/**
 * Updates all @cornerstonejs/* package versions across the OHIF workspace.
 *
 * Usage: node .scripts/cs3d-set-version.mjs <version>
 *
 * Only updates the 8 main CS3D packages (not codec packages):
 *   adapters, ai, core, dicom-image-loader, labelmap-interpolation,
 *   nifti-volume-loader, polymorphic-segmentation, tools
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

const version = process.argv[2];
if (!version) {
  console.error('Usage: cs3d-set-version.mjs <version>');
  console.error('  e.g. 4.18.2, 4.19.0-beta.1');
  process.exit(1);
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
    // Preserve original formatting (detect indent)
    const indent = content.match(/^(\s+)/m)?.[1] || '  ';
    writeFileSync(pkgPath, JSON.stringify(pkg, null, indent) + '\n');
    const rel = pkgPath.replace(rootDir + '/', '').replace(rootDir + '\\', '');
    console.log(`  Updated ${rel} (${changes} packages)`);
    totalChanges += changes;
  }
}

console.log(
  `\nDone: ${totalChanges} version(s) updated to ${version} across ${pkgPaths.length} package files.`
);
