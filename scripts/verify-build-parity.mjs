#!/usr/bin/env node
/**
 * Production build smoke test (single rsbuild pipeline).
 *
 * WS0.4 consolidated the app onto ONE production pipeline: repo-root
 * `rsbuild.config.ts`, invoked by `pnpm --filter @ohif/app run build`. The
 * former dual-pipeline parity harness (rspack.pwa.js vs rsbuild) has been
 * repurposed into this single-pipeline smoke test per WS0 acceptance #3.
 *
 * Builds the production output once and asserts the contract facts that the
 * cutover must preserve:
 *   - index.html present with BOTH inline scripts (window.PUBLIC_URL bootstrap
 *     + browserImportFunction) and PUBLIC_URL template resolved;
 *   - generated pluginImports.js consumed (codegen ran, plugin assets copied);
 *   - DefinePlugin globals VERSION_NUMBER / COMMIT_HASH baked;
 *   - APP_CONFIG (app-config.js) + google.js copied;
 *   - sw.js present with a populated __WB_MANIFEST and /plugins/ excluded from
 *     precache;
 *   - public/ + plugin dist/public asset copies land;
 *   - locale + codec chunks exist.
 *
 * Emits a pass/fail table and exits nonzero on any contract miss.
 *
 * Usage:
 *   node scripts/verify-build-parity.mjs            # build, then check
 *   node scripts/verify-build-parity.mjs --no-build # check existing dist
 */
import { execSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const APP_DIST = path.join(REPO_ROOT, 'platform/app/dist');
const PLUGIN_IMPORTS = path.join(REPO_ROOT, 'platform/app/src/pluginImports.js');

const VERSION_NUMBER = fs.readFileSync(path.join(REPO_ROOT, 'version.txt'), 'utf8').trim();
const COMMIT_HASH = fs.readFileSync(path.join(REPO_ROOT, 'commit.txt'), 'utf8').trim();

const NO_BUILD = process.argv.includes('--no-build');

function log(msg) {
  process.stdout.write(`${msg}\n`);
}

function cleanDist() {
  fs.rmSync(APP_DIST, { recursive: true, force: true });
}

function runBuild() {
  log(`\n[smoke] building production output (pnpm --filter @ohif/app run build) ...`);
  const start = Date.now();
  execSync(`pnpm --filter @ohif/app run build`, {
    cwd: REPO_ROOT,
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' },
  });
  log(`[smoke] built in ${((Date.now() - start) / 1000).toFixed(1)}s`);
}

// Fast recursive substring search over a directory tree (JS/text assets).
// Returns true if any file under `dir` (optionally filtered by suffix) contains
// `needle`. Uses grep for speed across the large dist tree.
function treeContains(dir, needle, includeGlob) {
  const args = ['-r', '-l', '-F', needle];
  if (includeGlob) {
    args.push(`--include=${includeGlob}`);
  }
  args.push(dir);
  const r = spawnSync('grep', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  // grep exit 0 = match, 1 = no match, >1 = error.
  return r.status === 0 && r.stdout.trim().length > 0;
}

function fileExists(p) {
  return fs.existsSync(p);
}

function readIfExists(p) {
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
}

// Any .wasm anywhere (cornerstone codecs / ICRPolySeg) => codec chunks present.
function hasWasm(dir) {
  const r = spawnSync('sh', ['-c', `find "${dir}" -name '*.wasm' | head -1`], {
    encoding: 'utf8',
  });
  return r.stdout.trim().length > 0;
}

// Gather the contract facts for the built dist directory.
function gatherFacts(dir) {
  const indexHtml = readIfExists(path.join(dir, 'index.html'));
  const sw = readIfExists(path.join(dir, 'sw.js'));

  // Extract precache manifest urls from the injected sw.js.
  const swUrls = [...sw.matchAll(/"url":"([^"]*)"/g)].map(m => m[1]);

  return {
    indexHtmlPresent: indexHtml.length > 0,
    inlineScriptBootstrap: indexHtml.includes('scriptToView'),
    inlineScriptBrowserImport: indexHtml.includes('browserImportFunction'),
    publicUrlResolved: indexHtml.length > 0 && !indexHtml.includes('PUBLIC_URL %>'),
    appConfigPresent: fileExists(path.join(dir, 'app-config.js')),
    googleConfigPresent: fileExists(path.join(dir, 'google.js')),
    versionBaked: treeContains(dir, VERSION_NUMBER, '*.js'),
    commitBaked: treeContains(dir, COMMIT_HASH, '*.js'),
    swPresent: sw.length > 0,
    swManifestCount: swUrls.length,
    swWbManifestReplaced: sw.length > 0 && !sw.includes('self.__WB_MANIFEST'),
    swPluginsExcluded: !swUrls.some(u => u.includes('/plugins/')),
    publicAssetsCopied: fileExists(path.join(dir, 'manifest.json')),
    pluginAssetsCopied:
      fileExists(path.join(dir, 'dicom-microscopy-viewer')) && fileExists(path.join(dir, 'ort')),
    codecChunks: hasWasm(dir),
    localeChunks: treeContains(dir, 'en-US', '*.js'),
  };
}

function main() {
  if (!NO_BUILD) {
    cleanDist();
    runBuild();
  } else {
    log('[smoke] --no-build: checking existing platform/app/dist');
  }

  if (!fs.existsSync(APP_DIST)) {
    log('[smoke] ERROR: platform/app/dist missing; run without --no-build first.');
    process.exit(2);
  }

  const pluginImportsGenerated = fileExists(PLUGIN_IMPORTS);
  const f = gatherFacts(APP_DIST);

  // Each check: label, value, pass predicate. pass = contract satisfied.
  const checks = [
    ['index.html present', f.indexHtmlPresent, x => x],
    ['inline script: window.PUBLIC_URL bootstrap', f.inlineScriptBootstrap, x => x],
    ['inline script: browserImportFunction', f.inlineScriptBrowserImport, x => x],
    ['PUBLIC_URL template resolved', f.publicUrlResolved, x => x],
    ['APP_CONFIG copied (app-config.js)', f.appConfigPresent, x => x],
    ['google.js copied', f.googleConfigPresent, x => x],
    ['pluginImports.js generated', pluginImportsGenerated, x => x],
    [`VERSION_NUMBER baked (${VERSION_NUMBER})`, f.versionBaked, x => x],
    [`COMMIT_HASH baked (${COMMIT_HASH.slice(0, 10)}…)`, f.commitBaked, x => x],
    ['sw.js present', f.swPresent, x => x],
    ['sw __WB_MANIFEST populated', f.swManifestCount, x => x > 0],
    ['sw __WB_MANIFEST placeholder replaced', f.swWbManifestReplaced, x => x],
    ['sw /plugins/ excluded from precache', f.swPluginsExcluded, x => x],
    ['public/ assets copied (manifest.json)', f.publicAssetsCopied, x => x],
    ['plugin dist/public assets copied (dmv + ort)', f.pluginAssetsCopied, x => x],
    ['codec chunks present (.wasm)', f.codecChunks, x => x],
    ['locale chunks present (en-US)', f.localeChunks, x => x],
  ];

  const fmt = v => (v === true ? 'yes' : v === false ? 'NO' : String(v));

  const rows = checks.map(([label, val, pred]) => ({
    label,
    value: fmt(val),
    pass: !!pred(val),
  }));

  const wLabel = Math.max(5, ...rows.map(r => r.label.length));
  const wValue = Math.max(5, ...rows.map(r => r.value.length));
  const pad = (s, w) => String(s).padEnd(w);

  log('\n===== PRODUCTION BUILD SMOKE (single rsbuild pipeline) =====\n');
  log(`${pad('CHECK', wLabel)}  ${pad('VALUE', wValue)}  RESULT`);
  log(`${'-'.repeat(wLabel)}  ${'-'.repeat(wValue)}  ------`);
  for (const r of rows) {
    log(`${pad(r.label, wLabel)}  ${pad(r.value, wValue)}  ${r.pass ? 'PASS' : 'FAIL'}`);
  }

  const failed = rows.filter(r => !r.pass);
  log('');
  if (failed.length) {
    log(`[smoke] ${failed.length} contract check(s) FAILED:`);
    for (const r of failed) {
      log(`  - ${r.label} (value=${r.value})`);
    }
    process.exit(1);
  }
  log(`[smoke] All ${rows.length} contract checks PASSED.`);
  process.exit(0);
}

main();
