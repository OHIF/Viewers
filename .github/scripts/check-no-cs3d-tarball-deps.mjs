#!/usr/bin/env node
/**
 * Exits with 1 if any package.json in the repo (excluding libs/@cornerstonejs)
 * has @cornerstonejs/* dependencies or resolutions pointing at GitHub release
 * tarball URLs. Used to block merging integration branches until deps are
 * reverted to npm versions.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

async function findPackageJsonFiles(dir, list = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.name === 'node_modules') continue;
    const relDir = path.relative(ROOT, full).replace(/\\/g, '/');
    if (e.isDirectory() && (relDir === 'libs/@cornerstonejs' || relDir.startsWith('libs/@cornerstonejs/'))) continue;
    if (e.isDirectory()) {
      await findPackageJsonFiles(full, list);
      continue;
    }
    if (e.name === 'package.json') list.push(full);
  }
  return list;
}

function collectTarballRefs(obj, filePath, out) {
  if (!obj || typeof obj !== 'object') return;
  for (const [key, value] of Object.entries(obj)) {
    if (key.startsWith('@cornerstonejs/') && typeof value === 'string' && value.startsWith('http')) {
      out.push({ file: path.relative(ROOT, filePath), pkg: key, value });
    }
    if (typeof value === 'object' && key !== 'scripts') collectTarballRefs(value, filePath, out);
  }
}

async function main() {
  const pkgPaths = await findPackageJsonFiles(ROOT);
  const refs = [];
  for (const p of pkgPaths) {
    const obj = JSON.parse(await fs.readFile(p, 'utf-8'));
    collectTarballRefs(obj, p, refs);
  }
  if (refs.length === 0) {
    console.log('OK: No @cornerstonejs/* tarball URLs in package.json files.');
    process.exit(0);
  }
  console.error('Merge block: package.json contains CS3D GitHub release tarball refs. Revert to npm versions before merging.');
  refs.forEach(({ file, pkg, value }) => console.error(`  ${file}: ${pkg} = ${value}`));
  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
