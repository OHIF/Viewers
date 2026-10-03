#!/usr/bin/env node
// scripts/ohif.mjs
//
// Workspace harness manager. The committed manifest (ohif.config.json) is
// authoritative: it pins the OHIF version and lists the plugins this
// workspace owns. The .ohif/ directory is a machine-managed, gitignored,
// disposable shallow checkout of the pinned OHIF tag -- nothing user-owned
// lives inside it, and it can be deleted and recreated at any time.
//
// Subcommands:
//   dev                    harness ensure, then the harness dev server with
//                          OHIF_ENV=ohif.config.json (workspace plugins are
//                          source-compiled with HMR via directory entries)
//   build                  harness ensure, then a production viewer build
//                          (output: .ohif/platform/app/dist)
//   doctor                 plugin config health checks (the harness doctor)
//   plugin <subcommand>    passthrough to the harness scripts/ohif-plugin.mjs
//                          (add/remove/list/link/unlink/doctor), pointed at
//                          pluginConfig.generated.json
//   harness ensure         shallow-clone the pinned tag + pnpm install +
//                          regenerate pluginConfig.generated.json
//   harness upgrade <tag>  re-pin ohif.config.json, re-clone, regenerate, doctor
//
// THE CHECKOUT IS READ-ONLY. ohif.config.json is the committed, authoritative
// manifest AND the build profile the harness passes as OHIF_ENV; the plugin set
// it declares is compiled into pluginConfig.generated.json (gitignored, in this
// workspace) and handed to the build as PLUGIN_CONFIG. Nothing is written inside
// .ohif/, so it can be deleted and recreated at any time — and an upgrade picks
// up the new version's default plugin set for free, because the generated file
// is rebuilt on top of whatever the fresh checkout ships.
//
// Uses node: built-ins only. pluginConfig manipulation is NOT reimplemented
// here: the harness checkout ships scripts/ohif-plugin.mjs, and PLUGIN_CONFIG
// redirects all of its subcommands (and the doctor) at the generated file.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

const WORKSPACE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MANIFEST_PATH = path.join(WORKSPACE_ROOT, 'ohif.config.json');
const HARNESS_DIR = path.join(WORKSPACE_ROOT, '.ohif');
const HARNESS_PLUGIN_SCRIPT = path.join(HARNESS_DIR, 'scripts', 'ohif-plugin.mjs');
const HARNESS_PLUGIN_CONFIG = path.join(HARNESS_DIR, 'platform', 'app', 'pluginConfig.json');
// Machine-managed (gitignored): the pluginConfig the harness build compiles
// from, derived from ohif.config.json on every `harness ensure`. It lives HERE,
// in the workspace, so nothing is ever written inside .ohif/.
const GENERATED_PLUGIN_CONFIG = path.join(WORKSPACE_ROOT, 'pluginConfig.generated.json');
const OHIF_REPO_URL = process.env.OHIF_REPO_URL || 'https://github.com/OHIF/Viewers.git';

const USAGE = `usage: node scripts/ohif.mjs <subcommand>

subcommands:
  dev                    ensure the harness, then start the dev server
  build                  ensure the harness, then build the viewer
  doctor                 plugin config health checks
  plugin <subcommand>    harness plugin helper (add/remove/list/link/unlink/doctor)
  harness ensure         clone the pinned tag, install, regenerate pluginConfig
  harness upgrade <tag>  re-pin the manifest to <tag>, re-clone, regenerate, doctor
`;

function die(code, message) {
  console.error(message);
  process.exit(code);
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    // .cmd shims on win32 need a shell under current Node versions.
    shell: process.platform === 'win32',
    ...options,
  });
  if (result.error) {
    die(1, `${command} ${args.join(' ')} failed: ${result.error.message}`);
  }
  if (result.status !== 0) {
    process.exit(result.status === null ? 1 : result.status);
  }
}

function readManifest() {
  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  } catch (error) {
    die(1, `cannot read ${MANIFEST_PATH}: ${error.message}`);
  }
  if (!manifest.ohifVersion || typeof manifest.ohifVersion !== 'string') {
    die(1, 'ohif.config.json must pin a string "ohifVersion"');
  }
  return manifest;
}

function writeManifest(manifest) {
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n');
}

// The harness version the runtime actually checks is version.txt (the build
// stamps it into process.env.VERSION_NUMBER); package.json is the fallback.
function harnessVersion() {
  try {
    return fs.readFileSync(path.join(HARNESS_DIR, 'version.txt'), 'utf8').trim();
  } catch {
    try {
      return JSON.parse(
        fs.readFileSync(path.join(HARNESS_DIR, 'platform', 'core', 'package.json'), 'utf8')
      ).version;
    } catch {
      return undefined;
    }
  }
}

// Import the harness's own plugin helper. Its exported subcommands resolve
// every path relative to the harness checkout, so no re-pointing is needed.
// The cache-busting query keeps `harness upgrade` (rm + re-clone in the same
// process) from being served a stale module from the ESM cache.
async function loadHarnessPluginModule() {
  if (!fs.existsSync(HARNESS_PLUGIN_SCRIPT)) {
    die(
      1,
      `${HARNESS_PLUGIN_SCRIPT} not found.\n` +
        'Run `node scripts/ohif.mjs harness ensure` first (and check that the pinned\n' +
        'ohifVersion in ohif.config.json is recent enough to ship scripts/ohif-plugin.mjs).'
    );
  }
  const url = pathToFileURL(HARNESS_PLUGIN_SCRIPT);
  url.searchParams.set('v', String(Date.now()));
  return import(url.href);
}

// Generate the pluginConfig the harness build should compile from, INTO THE
// WORKSPACE. The harness checkout is never written to: it is pointed at this
// file with PLUGIN_CONFIG (see harnessEnv), which is the whole reason .ohif/
// can stay a read-only, disposable clone.
//
// Base = the plugin set the pinned OHIF version ships, so upgrading the pin
// picks up its new defaults with no merge work here. On top of that, each
// manifest plugin is declared with an absolute `directory` so the build
// source-compiles the workspace's own folders (HMR in dev).
//
// Derived, not authoritative: ohif.config.json's plugins[] is the source of
// truth, and this file is regenerated on every `harness ensure`.
async function generatePluginConfig(manifest) {
  const helper = await loadHarnessPluginModule();
  const base = JSON.parse(fs.readFileSync(HARNESS_PLUGIN_CONFIG, 'utf8'));
  const config = { ...base, root: HARNESS_DIR.split(path.sep).join('/') };
  delete config.$schema; // the relative schema path is meaningless outside .ohif/

  for (const plugin of manifest.plugins || []) {
    if (!plugin || !plugin.packageName) {
      die(1, 'every ohif.config.json plugins[] entry needs a "packageName"');
    }
    if (!plugin.directory) {
      // Not workspace-owned (e.g. installed from npm into the harness);
      // declare it without a directory so node_modules resolution applies.
      const section = /\/mode-/.test(plugin.packageName) ? 'modes' : 'extensions';
      const bareList = config[section] || (config[section] = []);
      if (!bareList.some(entry => entry && entry.packageName === plugin.packageName)) {
        bareList.push({ packageName: plugin.packageName });
      }
      continue;
    }
    const absDir = path.resolve(WORKSPACE_ROOT, plugin.directory);
    const pkgPath = path.join(absDir, 'package.json');
    if (!fs.existsSync(pkgPath)) {
      die(1, `${plugin.packageName}: no package.json at ${absDir} (from "${plugin.directory}")`);
    }
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    const section =
      helper.sectionFromKeywords(pkg.keywords) ||
      (/(^|\/)modes\//.test(plugin.directory) ? 'modes' : 'extensions');
    // Absolute + forward slashes: the build's directory grammar treats anything
    // that is not './'- or '~'-prefixed as an absolute path, on every platform.
    const directory = absDir.split(path.sep).join('/');
    const list = config[section] || (config[section] = []);
    const existing = list.find(entry => entry && entry.packageName === plugin.packageName);
    if (existing) {
      existing.directory = directory;
    } else {
      list.push({ packageName: plugin.packageName, directory });
    }
    console.log(`linked ${plugin.packageName} -> ${directory}`);
  }

  fs.writeFileSync(GENERATED_PLUGIN_CONFIG, JSON.stringify(config, null, 2) + '\n');
  console.log(
    `generated ${path.basename(GENERATED_PLUGIN_CONFIG)} (derived from ohif.config.json)`
  );
}

// Environment for every harness invocation: the committed manifest doubles as
// the build profile (OHIF_ENV -> appConfig, publicUrl, …), and PLUGIN_CONFIG
// points at the generated file above. Set explicitly rather than through the
// profile because the generated file is machine-managed, not user-declared.
function harnessEnv() {
  return {
    ...process.env,
    OHIF_ENV: MANIFEST_PATH,
    PLUGIN_CONFIG: GENERATED_PLUGIN_CONFIG,
  };
}

// The app config is no longer copied into the checkout: a './'-prefixed
// `appConfig` in the manifest resolves against the workspace and the build
// copies it straight to dist/app-config.js. Fail early with a clear message
// instead of letting the build fail on a missing copy source.
function assertAppConfig(manifest) {
  const configured = manifest.appConfig || './config/app-config.js';
  const source = path.resolve(WORKSPACE_ROOT, configured);
  if (!fs.existsSync(source)) {
    die(
      1,
      `app config not found: ${source} (ohif.config.json "appConfig")\n` +
        'Use a "./"-prefixed path for a file this workspace owns, e.g. "./config/app-config.js".'
    );
  }
}

async function harnessEnsure() {
  const manifest = readManifest();
  const tag = `v${manifest.ohifVersion}`;
  if (!fs.existsSync(path.join(HARNESS_DIR, 'package.json'))) {
    console.log(`cloning OHIF ${tag} into .ohif/ (shallow)`);
    run('git', ['clone', '--depth', '1', '--branch', tag, OHIF_REPO_URL, HARNESS_DIR]);
  } else {
    const current = harnessVersion();
    if (current && current !== manifest.ohifVersion) {
      die(
        1,
        `.ohif/ contains OHIF ${current} but ohif.config.json pins ${manifest.ohifVersion}.\n` +
          `Run: node scripts/ohif.mjs harness upgrade ${tag}\n` +
          '(or delete .ohif/ and re-run; the harness is disposable)'
      );
    }
  }
  if (!fs.existsSync(path.join(HARNESS_DIR, 'node_modules'))) {
    console.log('installing harness dependencies (pnpm install)');
    run('pnpm', ['install'], { cwd: HARNESS_DIR });
  }
  assertAppConfig(manifest);
  await generatePluginConfig(manifest);
}

async function cmdDev() {
  await harnessEnsure();
  console.log('starting the harness dev server (OHIF_ENV=ohif.config.json)');
  run('pnpm', ['run', 'dev'], { cwd: HARNESS_DIR, env: harnessEnv() });
}

async function cmdBuild() {
  await harnessEnsure();
  console.log('building the viewer (OHIF_ENV=ohif.config.json)');
  run('pnpm', ['run', 'build'], { cwd: HARNESS_DIR, env: harnessEnv() });
  console.log('build output: .ohif/platform/app/dist (the Dockerfile packages it with nginx)');
}

async function cmdPlugin(args) {
  // PLUGIN_CONFIG makes the harness helper read and write the GENERATED config,
  // never the checkout's own. Mutating subcommands therefore edit a derived
  // file: useful for a quick experiment, but ohif.config.json is authoritative
  // and the next `harness ensure` regenerates from it.
  Object.assign(process.env, harnessEnv());
  if (['add', 'remove', 'link', 'unlink'].includes(args[0])) {
    console.log(
      `note: this edits ${path.basename(GENERATED_PLUGIN_CONFIG)}, which is regenerated from ` +
        'ohif.config.json — add the plugin to its "plugins" array to make the change stick.'
    );
  }
  const helper = await loadHarnessPluginModule();
  helper.main(args); // process.exits with the subcommand's status
}

async function cmdHarness(args) {
  const [action, ...rest] = args;
  if (action === 'ensure') {
    await harnessEnsure();
    return;
  }
  if (action === 'upgrade') {
    const tag = rest[0];
    if (!tag) {
      die(2, 'usage: node scripts/ohif.mjs harness upgrade <tag>');
    }
    const manifest = readManifest();
    manifest.ohifVersion = tag.replace(/^v/, '');
    writeManifest(manifest);
    console.log(`pinned ohif.config.json to ${manifest.ohifVersion}; recreating .ohif/`);
    fs.rmSync(HARNESS_DIR, { recursive: true, force: true });
    await harnessEnsure();
    const helper = await loadHarnessPluginModule();
    process.exit(helper.cmdDoctor([]) || 0);
  }
  die(2, USAGE);
}

async function main() {
  const [subcommand, ...rest] = process.argv.slice(2);
  switch (subcommand) {
    case 'dev':
      return cmdDev();
    case 'build':
      return cmdBuild();
    case 'doctor':
      return cmdPlugin(['doctor']);
    case 'plugin':
      return cmdPlugin(rest);
    case 'harness':
      return cmdHarness(rest);
    default:
      die(2, USAGE);
  }
}

main().catch(error => {
  die(1, error && error.stack ? error.stack : String(error));
});
