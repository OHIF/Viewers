#!/usr/bin/env node
'use strict';

/**
 * postinstall script: ensure every copy of @babel/helper-compilation-targets
 * has access to lru-cache@5.x (which exports a class constructor).
 *
 * Background: lru-cache@11.x exports { LRUCache } instead of a default
 * constructor, causing "@babel/helper-compilation-targets" to crash with
 * "_lruCache is not a constructor". Yarn selective resolutions only fix the
 * top-level copy; nested copies (e.g. under @babel/preset-env/node_modules)
 * may still resolve to the wrong version depending on hoisting.
 *
 * This script finds ALL copies of @babel/helper-compilation-targets in the
 * node_modules tree and ensures each one can resolve lru-cache@5.x.
 */

const fs = require('fs');
const path = require('path');

const TARGET_PKG = '@babel/helper-compilation-targets';

function findAllCopies(rootNodeModules) {
  const copies = [];

  function search(dir, depth) {
    if (depth > 8) return; // avoid runaway recursion

    const babelDir = path.join(dir, 'node_modules', '@babel', 'helper-compilation-targets');
    if (fs.existsSync(path.join(babelDir, 'package.json'))) {
      copies.push(babelDir);
    }

    // Also search inside scoped and unscoped packages for nested node_modules
    const nmDir = path.join(dir, 'node_modules');
    if (!fs.existsSync(nmDir)) return;

    let entries;
    try {
      entries = fs.readdirSync(nmDir);
    } catch {
      return;
    }

    for (const entry of entries) {
      if (entry === '.cache' || entry === '.bin') continue;

      const entryPath = path.join(nmDir, entry);
      let stat;
      try {
        stat = fs.lstatSync(entryPath);
      } catch {
        continue;
      }

      if (entry.startsWith('@') && stat.isDirectory()) {
        // Scoped package — look inside for sub-packages
        let scopeEntries;
        try {
          scopeEntries = fs.readdirSync(entryPath);
        } catch {
          continue;
        }
        for (const scopeEntry of scopeEntries) {
          const pkgPath = path.join(entryPath, scopeEntry);
          if (fs.existsSync(path.join(pkgPath, 'node_modules'))) {
            search(pkgPath, depth + 1);
          }
        }
      } else if (stat.isDirectory() && fs.existsSync(path.join(entryPath, 'node_modules'))) {
        search(entryPath, depth + 1);
      }
    }
  }

  // Check top-level
  const topLevel = path.join(rootNodeModules, '@babel', 'helper-compilation-targets');
  if (fs.existsSync(path.join(topLevel, 'package.json'))) {
    copies.push(topLevel);
  }

  // Search nested copies
  let entries;
  try {
    entries = fs.readdirSync(rootNodeModules);
  } catch {
    return copies;
  }

  for (const entry of entries) {
    if (entry === '.cache' || entry === '.bin') continue;
    const entryPath = path.join(rootNodeModules, entry);

    let stat;
    try {
      stat = fs.lstatSync(entryPath);
    } catch {
      continue;
    }

    if (entry.startsWith('@') && stat.isDirectory()) {
      let scopeEntries;
      try {
        scopeEntries = fs.readdirSync(entryPath);
      } catch {
        continue;
      }
      for (const scopeEntry of scopeEntries) {
        const pkgPath = path.join(entryPath, scopeEntry);
        if (fs.existsSync(path.join(pkgPath, 'node_modules'))) {
          search(pkgPath, 0);
        }
      }
    } else if (stat.isDirectory() && fs.existsSync(path.join(entryPath, 'node_modules'))) {
      search(entryPath, 0);
    }
  }

  return [...new Set(copies)];
}

function isLruCacheV5(lruCachePath) {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(lruCachePath, 'package.json'), 'utf8'));
    return pkg.version && pkg.version.startsWith('5.');
  } catch {
    return false;
  }
}

function findLruCacheV5Source(rootNodeModules) {
  // Look for lru-cache@5.x anywhere in the tree (the selective resolution should have installed it)
  const candidates = [
    path.join(rootNodeModules, '@babel', 'helper-compilation-targets', 'node_modules', 'lru-cache'),
    path.join(rootNodeModules, 'lru-cache'),
  ];

  for (const candidate of candidates) {
    if (isLruCacheV5(candidate)) {
      return candidate;
    }
  }

  return null;
}

function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function main() {
  const rootDir = path.resolve(__dirname, '..');
  const rootNodeModules = path.join(rootDir, 'node_modules');

  if (!fs.existsSync(rootNodeModules)) {
    // node_modules not yet created; nothing to do
    return;
  }

  console.log('[ensure-babel-lru-cache] Scanning for copies of', TARGET_PKG, '...');

  const copies = findAllCopies(rootNodeModules);
  if (copies.length === 0) {
    console.log('[ensure-babel-lru-cache] No copies of', TARGET_PKG, 'found.');
    return;
  }

  console.log('[ensure-babel-lru-cache] Found', copies.length, 'copy(ies):', copies.map(c => path.relative(rootDir, c)));

  // Find a v5 source to copy from
  const v5Source = findLruCacheV5Source(rootNodeModules);

  let fixCount = 0;
  for (const copy of copies) {
    const localLruCache = path.join(copy, 'node_modules', 'lru-cache');

    if (isLruCacheV5(localLruCache)) {
      // Already has v5 — good
      continue;
    }

    // Check what lru-cache would resolve to from this location
    // Walk up looking for lru-cache in node_modules
    let resolvedLruCache = null;
    let searchDir = copy;
    while (searchDir !== path.dirname(searchDir)) {
      const candidate = path.join(searchDir, 'node_modules', 'lru-cache');
      if (fs.existsSync(path.join(candidate, 'package.json'))) {
        resolvedLruCache = candidate;
        break;
      }
      searchDir = path.dirname(searchDir);
    }

    if (resolvedLruCache && isLruCacheV5(resolvedLruCache)) {
      // Would resolve to v5 — good
      continue;
    }

    // Need to fix this copy
    if (!v5Source) {
      console.error(
        '[ensure-babel-lru-cache] ERROR: Need to install lru-cache@5.x into',
        path.relative(rootDir, copy),
        'but no v5 source found. Try: yarn add lru-cache@5.1.1 --dev'
      );
      continue;
    }

    console.log(
      '[ensure-babel-lru-cache] Fixing:',
      path.relative(rootDir, copy),
      '- copying lru-cache@5.x into its node_modules'
    );

    fs.mkdirSync(path.join(copy, 'node_modules'), { recursive: true });
    copyDirSync(v5Source, localLruCache);
    fixCount++;
  }

  if (fixCount > 0) {
    console.log('[ensure-babel-lru-cache] Fixed', fixCount, 'copy(ies).');
  } else {
    console.log('[ensure-babel-lru-cache] All copies already have correct lru-cache. No fixes needed.');
  }
}

main();
