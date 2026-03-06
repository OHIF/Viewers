#!/usr/bin/env node
/**
 * Updates OHIF package.json dependency references for @cornerstonejs/* packages
 * to point at tarball URLs from a CS3D GitHub release. Writes .github/cs3d-integration.json.
 *
 * Usage:
 *   node update-cs3d-deps-from-assets.mjs --assets <path-to-JSON-or-TSV> [options]
 *   node update-cs3d-deps-from-assets.mjs --release-tag <tag> --repo <owner/repo> [options]
 *
 * Options:
 *   --mode integration-only | paired-change
 *   --metadata-path <path>  default .github/cs3d-integration.json
 *   --cs3d-pr <number>     for integration-only
 *   --cs3d-sha <sha>
 *   --cs3d-repo <owner/repo>
 *   --cs3d-merged-version <version>  for merged-refresh
 *   --cs3d-merged-sha <sha>
 *
 * Asset list: JSON array of { name } or TSV with header row, first column = asset name.
 * Package mapping: asset "cornerstonejs-<pkg>-<version>.tgz" -> @cornerstonejs/<pkg>
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

/** Parse asset filename to @cornerstonejs package name. e.g. cornerstonejs-dicom-image-loader-4.18.5.tgz -> @cornerstonejs/dicom-image-loader */
function assetNameToPackage(assetName) {
  if (!assetName.endsWith('.tgz')) return null;
  const base = assetName.slice(0, -4);
  if (!base.startsWith('cornerstonejs-')) return null;
  const rest = base.slice('cornerstonejs-'.length);
  const lastDash = rest.lastIndexOf('-');
  if (lastDash === -1) return null;
  const possibleVer = rest.slice(lastDash + 1);
  if (!/^\d+\.\d+\.\d+(-.+)?$/.test(possibleVer)) return null;
  const pkgPart = rest.slice(0, lastDash);
  return `@cornerstonejs/${pkgPart}`;
}

/** Build tarball URL for a release asset. */
function tarballUrl(ownerRepo, tag, assetName) {
  const encoded = encodeURIComponent(assetName);
  return `https://github.com/${ownerRepo}/releases/download/${tag}/${encoded}`;
}

/** Recursively find all package.json under dir, excluding node_modules and libs/@cornerstonejs (CS3D sub-repo). */
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

/** Update one package.json: replace any dep in packageMap (pkg -> tarball URL) in deps, peerDependencies, optionalDependencies. */
function updatePackageJson(obj, packageMap) {
  let changed = false;
  for (const key of ['dependencies', 'peerDependencies', 'optionalDependencies']) {
    if (!obj[key] || typeof obj[key] !== 'object') continue;
    for (const [pkg, url] of Object.entries(packageMap)) {
      if (obj[key][pkg] !== undefined) {
        obj[key][pkg] = url;
        changed = true;
      }
    }
  }
  return changed;
}

/** Update root package.json resolutions for packageMap. */
function updateResolutions(obj, packageMap) {
  if (!obj.resolutions || typeof obj.resolutions !== 'object') return false;
  let changed = false;
  for (const [pkg, url] of Object.entries(packageMap)) {
    if (obj.resolutions[pkg] !== undefined) {
      obj.resolutions[pkg] = url;
      changed = true;
    }
  }
  return changed;
}

async function loadAssetList(assetsInput, releaseTag, ownerRepo, token) {
  if (assetsInput) {
    const raw = await fs.readFile(assetsInput, 'utf-8');
    let names = [];
    if (assetsInput.endsWith('.json')) {
      const data = JSON.parse(raw);
      names = Array.isArray(data) ? data.map((a) => (typeof a === 'string' ? a : a.name)) : Object.keys(data);
    } else {
      const lines = raw.trim().split('\n');
      const first = lines[0];
      const idx = first.includes('\t') ? 0 : 0;
      names = lines.slice(1).map((line) => line.split(/\t/)[idx].trim()).filter(Boolean);
      if (lines[0] && !lines[0].startsWith('cornerstonejs-')) names = [first.split(/\t/)[idx].trim(), ...names];
    }
    return names;
  }
  if (releaseTag && ownerRepo && token) {
    const [owner, repo] = ownerRepo.split('/');
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/releases/tags/${encodeURIComponent(releaseTag)}`,
      { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json' } }
    );
    if (!res.ok) throw new Error(`Release fetch failed: ${res.status} ${await res.text()}`);
    const release = await res.json();
    return (release.assets || []).map((a) => a.name);
  }
  throw new Error('Provide either --assets <file> or --release-tag and --repo and GH token');
}

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {
    assets: null,
    releaseTag: null,
    repo: null,
    mode: 'integration-only',
    metadataPath: path.join(ROOT, '.github', 'cs3d-integration.json'),
    cs3dPr: null,
    cs3dSha: null,
    cs3dRepo: null,
    cs3dMergedVersion: null,
    cs3dMergedSha: null,
  };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--assets' && args[i + 1]) { out.assets = path.resolve(args[++i]); continue; }
    if (args[i] === '--release-tag' && args[i + 1]) { out.releaseTag = args[++i]; continue; }
    if (args[i] === '--repo' && args[i + 1]) { out.repo = args[++i]; continue; }
    if (args[i] === '--mode' && args[i + 1]) { out.mode = args[++i]; continue; }
    if (args[i] === '--metadata-path' && args[i + 1]) { out.metadataPath = path.resolve(args[++i]); continue; }
    if (args[i] === '--cs3d-pr' && args[i + 1]) { out.cs3dPr = args[++i]; continue; }
    if (args[i] === '--cs3d-sha' && args[i + 1]) { out.cs3dSha = args[++i]; continue; }
    if (args[i] === '--cs3d-repo' && args[i + 1]) { out.cs3dRepo = args[++i]; continue; }
    if (args[i] === '--cs3d-merged-version' && args[i + 1]) { out.cs3dMergedVersion = args[++i]; continue; }
    if (args[i] === '--cs3d-merged-sha' && args[i + 1]) { out.cs3dMergedSha = args[++i]; continue; }
  }
  return out;
}

async function main() {
  const opts = parseArgs();
  const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
  const assetNames = await loadAssetList(opts.assets, opts.releaseTag, opts.repo, token);

  const packageToUrl = {};
  const ownerRepo = opts.repo || opts.cs3dRepo;
  const tag = opts.releaseTag;
  if (!ownerRepo || !tag) throw new Error('Need --repo and --release-tag (or from payload) for tarball URLs');

  for (const name of assetNames) {
    const pkg = assetNameToPackage(name);
    if (pkg) packageToUrl[pkg] = tarballUrl(ownerRepo, tag, name);
  }

  if (Object.keys(packageToUrl).length === 0) {
    console.warn('No @cornerstonejs tarball assets found in asset list.');
    process.exit(1);
  }

  const pkgPaths = await findPackageJsonFiles(ROOT);
  for (const p of pkgPaths) {
    const obj = JSON.parse(await fs.readFile(p, 'utf-8'));
    const isRoot = path.dirname(p) === ROOT;
    let changed = updatePackageJson(obj, packageToUrl);
    if (isRoot) changed = updateResolutions(obj, packageToUrl) || changed;
    if (changed) await fs.writeFile(p, JSON.stringify(obj, null, 2) + '\n');
  }

  const metadata = {
    mode: opts.mode,
    cs3dPr: opts.cs3dPr ? Number(opts.cs3dPr) : undefined,
    cs3dSha: opts.cs3dSha || undefined,
    releaseTag: tag,
    cs3dRepo: ownerRepo,
    cs3dMergedVersion: opts.cs3dMergedVersion || undefined,
    cs3dMergedSha: opts.cs3dMergedSha || undefined,
  };
  await fs.mkdir(path.dirname(opts.metadataPath), { recursive: true });
  await fs.writeFile(opts.metadataPath, JSON.stringify(metadata, null, 2) + '\n');
  console.log('Updated CS3D deps to release', tag, 'and wrote', opts.metadataPath);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
