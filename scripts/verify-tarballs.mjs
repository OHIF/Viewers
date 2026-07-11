// scripts/verify-tarballs.mjs
//
// Tarball verification harness for the published OHIF SDK packages (WS1.6,
// narrowed by B6 to the tiered publish surface).
//
// Two jobs:
//   1. Tier check: exactly the SDK set below is publishable. Every other
//      package under extensions/, modes/, platform/ must carry private:true
//      (platform/app excepted -- see note on SKIP_DIRS).
//   2. Pack check: for each SDK package, run `pnpm pack` (which applies the
//      same manifest transforms as `pnpm publish`) and assert the tarball
//      honors the plugin/package contract: dist UMD present, entry-point
//      fields resolve to packed files, workspace: specifiers rewritten,
//      publishConfig overrides consumed, no react/react-dom bundled.
//
// Dependency-free by design: node:fs, node:path, node:child_process, node:os
// only. Run via `pnpm run verify:tarballs` after building the package dists.

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);

// The published SDK: the contract surface third-party plugin authors compile
// and run against (B6). Derived (WS7.5) from the @ohif/* members of
// .rspack/pluginExternals.js hostSharedPackages -- the same list that drives
// the externals contract and the runtimeShared window globals -- so the
// externals list, the window-global list, and the npm publish set cannot
// drift (B6 machine-checked invariant). @ohif/ui is filtered defensively:
// it is a forbidden runtime-plugin import and must never be published as
// part of the SDK even if it ever leaks into hostSharedPackages.
const { hostSharedPackages } = require('../.rspack/pluginExternals.js');
const SDK_PUBLISHED = hostSharedPackages.filter(
  name => name.startsWith('@ohif/') && name !== '@ohif/ui'
);

// Published tooling outside the SDK contract surface (the "plus tooling" half
// of B6, mirrored in publish-package.mjs). create-ohif ships raw .mjs +
// templates with no dist UMD bundle, so it is allowed to be non-private and
// listed in publish-package.mjs but exempt from the SDK tarball assertions.
const PUBLISHED_TOOLING = ['create-ohif'];

// platform/app is the host application, out of the plugin contract (WS1.6
// step 1). B6 leaves @ohif/app's publish status flagged-not-decided (its npm
// tarball may be consumed as a prebuilt-viewer artifact), so it is neither
// packed nor required to be private here.
const SKIP_DIRS = new Set(['platform/app']);

const PACKAGE_ROOTS = ['extensions', 'modes', 'platform'];

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const isWindows = process.platform === 'win32';

const failures = [];
function fail(pkgLabel, message) {
  failures.push(`${pkgLabel}: ${message}`);
}

// ---------------------------------------------------------------------------
// Enumerate workspace packages (mirrors publish-package.mjs globs).
// ---------------------------------------------------------------------------
function enumeratePackages() {
  const packages = [];
  for (const root of PACKAGE_ROOTS) {
    const rootDir = path.join(repoRoot, root);
    if (!fs.existsSync(rootDir)) {
      continue;
    }
    for (const entry of fs.readdirSync(rootDir)) {
      const relDir = `${root}/${entry}`;
      const dir = path.join(rootDir, entry);
      const manifestPath = path.join(dir, 'package.json');
      if (!fs.statSync(dir).isDirectory() || !fs.existsSync(manifestPath)) {
        continue;
      }
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      packages.push({ relDir, dir, manifest });
    }
  }
  return packages;
}

// ---------------------------------------------------------------------------
// Tier check (B6): publishable set == SDK_PUBLISHED, everything else private.
// ---------------------------------------------------------------------------
function checkPublishTier(packages) {
  const foundSdk = new Set();
  for (const pkg of packages) {
    if (SKIP_DIRS.has(pkg.relDir)) {
      continue;
    }
    const name = pkg.manifest.name || pkg.relDir;
    const isPrivate = pkg.manifest.private === true;
    if (SDK_PUBLISHED.includes(name)) {
      foundSdk.add(name);
      if (isPrivate) {
        fail(name, `is in the published SDK set but marked private:true (${pkg.relDir})`);
      }
    } else if (PUBLISHED_TOOLING.includes(name)) {
      if (isPrivate) {
        fail(name, `is published tooling but marked private:true (${pkg.relDir})`);
      }
    } else if (!isPrivate) {
      fail(
        name,
        `is publishable but outside the published SDK set; mark it private:true (${pkg.relDir})`
      );
    }
  }
  for (const name of SDK_PUBLISHED) {
    if (!foundSdk.has(name)) {
      fail(name, 'expected published SDK package not found in the workspace');
    }
  }
}

// ---------------------------------------------------------------------------
// Publish-list parity (B6 machine-checked invariant, publish-script half):
// the directories publish-package.mjs publishes must name exactly the
// SDK_PUBLISHED packages. Without this, deleting an entry from
// publish-package.mjs silently stops publishing that package while the tier
// check above stays green (it only inspects workspace manifests). The script
// is parsed textually because importing it would execute its publish flow.
// ---------------------------------------------------------------------------
function checkPublishListParity(packages) {
  const publishScript = path.join(repoRoot, 'publish-package.mjs');
  let source;
  try {
    source = fs.readFileSync(publishScript, 'utf8');
  } catch (error) {
    fail('publish-package.mjs', `could not read publish script for parity check: ${error.message}`);
    return;
  }
  const arrayMatch = source.match(/const packages = \[([\s\S]*?)\];/);
  if (!arrayMatch) {
    fail('publish-package.mjs', "could not locate the 'const packages = [...]' publish list");
    return;
  }
  const publishDirs = [...arrayMatch[1].matchAll(/'([^']+)'/g)].map(m => m[1]);
  const byDir = new Map(packages.map(pkg => [pkg.relDir, pkg]));
  const publishedNames = new Set();
  for (const dir of publishDirs) {
    if (SKIP_DIRS.has(dir)) {
      continue; // platform/app: publish status flagged-not-decided (B6)
    }
    const pkg = byDir.get(dir);
    if (!pkg) {
      // Forward-declared directory that does not exist yet;
      // publish-package.mjs's glob likewise matches nothing and skips it.
      continue;
    }
    const name = pkg.manifest.name || dir;
    if (PUBLISHED_TOOLING.includes(name)) {
      continue; // published tooling (create-ohif), outside the SDK parity set
    }
    publishedNames.add(name);
    if (!SDK_PUBLISHED.includes(name)) {
      fail(name, `listed in publish-package.mjs (${dir}) but not in SDK_PUBLISHED`);
    }
  }
  for (const name of SDK_PUBLISHED) {
    if (!publishedNames.has(name)) {
      fail(name, 'in SDK_PUBLISHED but missing from the publish-package.mjs packages list');
    }
  }
}

// ---------------------------------------------------------------------------
// Tarball helpers.
// ---------------------------------------------------------------------------
function run(cmd, args, options = {}) {
  const result = spawnSync(cmd, args, {
    encoding: 'utf8',
    maxBuffer: 256 * 1024 * 1024,
    shell: isWindows,
    ...options,
  });
  if (result.status !== 0) {
    const detail = (result.stderr || result.stdout || String(result.error || '')).trim();
    throw new Error(`${cmd} ${args.join(' ')} failed (exit ${result.status}): ${detail}`);
  }
  return result.stdout;
}

function packPackage(pkg, outDir) {
  const unscoped = pkg.manifest.name.split('/').pop();
  const tgzPath = path.join(outDir, `${unscoped}.tgz`);
  run('pnpm', ['pack', '--out', tgzPath], { cwd: pkg.dir });
  return tgzPath;
}

function listTarball(tgzPath) {
  // Entries come back as package/<path>; normalize to <path>.
  return run('tar', ['-tzf', tgzPath])
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(entry => entry.replace(/^package\//, ''));
}

function readTarballFile(tgzPath, entry) {
  return run('tar', ['-xOzf', tgzPath, `package/${entry}`]);
}

function normalizeTarget(target) {
  return target.replace(/^\.\//, '');
}

// Collect every string target reachable in an exports value, including nested
// condition objects.
function collectExportTargets(exportsValue, out = []) {
  if (typeof exportsValue === 'string') {
    out.push(exportsValue);
  } else if (exportsValue && typeof exportsValue === 'object') {
    for (const value of Object.values(exportsValue)) {
      collectExportTargets(value, out);
    }
  }
  return out;
}

function targetSatisfied(target, entrySet, entries) {
  const normalized = normalizeTarget(target);
  if (normalized.includes('*')) {
    // Wildcard subpath: assert the directory prefix exists in the tarball.
    const prefix = normalized.slice(0, normalized.indexOf('*'));
    return entries.some(entry => entry.startsWith(prefix));
  }
  return entrySet.has(normalized);
}

// ---------------------------------------------------------------------------
// Per-tarball assertions (WS1.6 step 3, narrowed to the SDK set by B6).
// ---------------------------------------------------------------------------
function verifyTarball(pkg, tgzPath) {
  const name = pkg.manifest.name;
  const entries = listTarball(tgzPath);
  const entrySet = new Set(entries);
  const packed = JSON.parse(readTarballFile(tgzPath, 'package.json'));
  const isExtension = pkg.relDir.startsWith('extensions/');
  const isMode = pkg.relDir.startsWith('modes/');
  let mainMissing = false;

  // (a) main points at the dist UMD bundle and the file is in the tarball.
  if (packed.main) {
    if ((isExtension || isMode) && !/^dist\/ohif-[a-z0-9-]+\.umd\.js$/.test(packed.main)) {
      fail(name, `packed main '${packed.main}' does not match dist/ohif-*.umd.js`);
    }
    if (!entrySet.has(normalizeTarget(packed.main))) {
      fail(name, `main target '${packed.main}' missing from tarball`);
      mainMissing = true;
    }
  } else {
    fail(name, 'packed manifest has no main field');
  }

  // (b) module, types, and every exports target resolve to packed entries.
  for (const [field, value] of [
    ['module', packed.module],
    ['types', packed.types],
  ]) {
    if (typeof value === 'string' && !targetSatisfied(value, entrySet, entries)) {
      fail(name, `${field} target '${value}' missing from tarball`);
    }
  }
  if (packed.exports) {
    for (const target of collectExportTargets(packed.exports)) {
      if (!targetSatisfied(target, entrySet, entries)) {
        fail(name, `exports target '${target}' missing from tarball`);
      }
    }
  }

  // (c) workspace: specifiers must have been rewritten to concrete versions.
  const depSections = JSON.stringify({
    dependencies: packed.dependencies || {},
    peerDependencies: packed.peerDependencies || {},
    optionalDependencies: packed.optionalDependencies || {},
  });
  if (depSections.includes('workspace:')) {
    fail(name, "packed dependencies still contain 'workspace:' specifiers");
  }

  // (d) plugin-discovery keywords.
  if (isExtension && !(packed.keywords || []).includes('ohif-extension')) {
    fail(name, "keywords missing 'ohif-extension'");
  }
  if (isMode && !(packed.keywords || []).includes('ohif-mode')) {
    fail(name, "keywords missing 'ohif-mode'");
  }

  // (e) publishConfig overrides consumed by pnpm; access is public.
  const packedPublishConfig = packed.publishConfig || {};
  for (const field of ['main', 'module', 'types', 'exports']) {
    if (field in packedPublishConfig) {
      fail(name, `packed publishConfig still contains '${field}' (override not consumed)`);
    }
  }
  if (packedPublishConfig.access !== 'public') {
    fail(name, "packed publishConfig.access is not 'public'");
  }

  // (f) tarball ships a dist UMD bundle and the source entry point.
  if (!entries.some(entry => /^dist\/.*\.umd\.js$/.test(entry))) {
    fail(name, 'tarball contains no dist/*.umd.js bundle');
  }
  const srcEntry = pkg.manifest.module; // source manifest, pre-override
  if (typeof srcEntry === 'string' && srcEntry.startsWith('src/') && !entrySet.has(srcEntry)) {
    fail(name, `source entry '${srcEntry}' missing from tarball`);
  }

  // (g) React-singleton guard: no react/react-dom code bundled into the UMD
  // output (regression test for the externals contract).
  for (const entry of entries) {
    if (!/^dist\/.*\.umd\.js\.map$/.test(entry)) {
      continue;
    }
    let sources = [];
    try {
      sources = JSON.parse(readTarballFile(tgzPath, entry)).sources || [];
    } catch (error) {
      fail(name, `could not parse sourcemap '${entry}': ${error.message}`);
      continue;
    }
    const offenders = sources.filter(
      source => source.includes('node_modules/react/') || source.includes('node_modules/react-dom/')
    );
    if (offenders.length > 0) {
      fail(
        name,
        `bundled react/react-dom detected in '${entry}' (${offenders.length} sources, e.g. ${offenders[0]})`
      );
    }
  }

  // (h) extensions/cornerstone: legacy UI package retired from the peer surface.
  if (name === '@ohif/extension-cornerstone') {
    const peers = packed.peerDependencies || {};
    if ('@ohif/ui' in peers) {
      fail(name, "peerDependencies still contain '@ohif/ui'");
    }
    if (!('@ohif/ui-next' in peers)) {
      fail(name, "peerDependencies missing '@ohif/ui-next'");
    }
  }

  return { mainMissing };
}

// ---------------------------------------------------------------------------
// Main.
// ---------------------------------------------------------------------------
function main() {
  const packages = enumeratePackages();
  checkPublishTier(packages);
  checkPublishListParity(packages);

  const sdkPackages = packages.filter(pkg => SDK_PUBLISHED.includes(pkg.manifest.name));
  const outDir = path.join(os.tmpdir(), 'ohif-verify');
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  let packedCount = 0;
  let mainMissingCount = 0;
  for (const pkg of sdkPackages) {
    const name = pkg.manifest.name;
    let tgzPath;
    try {
      tgzPath = packPackage(pkg, outDir);
    } catch (error) {
      if (String(error.message).includes('CANNOT_RESOLVE_WORKSPACE_PROTOCOL')) {
        fail(
          name,
          'pnpm pack could not resolve a workspace: dependency because it is not ' +
            "linked in the package's node_modules. The local install is stale " +
            "relative to the manifest; run 'pnpm install --no-frozen-lockfile' " +
            'and retry.'
        );
      } else {
        fail(name, `pnpm pack failed: ${error.message}`);
      }
      continue;
    }
    packedCount += 1;
    const failuresBefore = failures.length;
    const { mainMissing } = verifyTarball(pkg, tgzPath);
    if (mainMissing) {
      mainMissingCount += 1;
    }
    if (failures.length === failuresBefore) {
      console.log(`OK ${name} (${path.basename(tgzPath)})`);
    }
  }

  if (failures.length > 0) {
    console.error(`\n${failures.length} tarball contract failure(s):`);
    for (const failure of failures) {
      console.error(`  FAIL ${failure}`);
    }
    if (packedCount > 0 && mainMissingCount === packedCount) {
      console.error(
        '\nHint: every package is missing its built bundle. Run ' +
          "'pnpm run build:package-all && pnpm run build:package-all-1' first."
      );
    }
    process.exit(1);
  }

  console.log(
    `\nAll checks passed: ${sdkPackages.length} published SDK package(s) verified, ` +
      `${packages.length - sdkPackages.length} workspace package(s) confirmed private or skipped.`
  );
}

main();
