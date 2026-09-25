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
//                          APP_CONFIG=config/workspace.js (workspace plugins
//                          are source-compiled with HMR via directory links)
//   build                  harness ensure, then a production viewer build
//                          (output: .ohif/platform/app/dist)
//   doctor                 plugin config health checks (the harness doctor)
//   plugin <subcommand>    passthrough to the harness scripts/ohif-plugin.mjs
//                          (add/remove/list/link/unlink/doctor), which reads
//                          and writes .ohif/platform/app/pluginConfig.json
//   harness ensure         shallow-clone the pinned tag + pnpm install +
//                          link every manifest plugin + sync the app config
//   harness upgrade <tag>  re-pin ohif.config.json, re-clone, re-link, doctor
//
// Uses node: built-ins only. The pluginConfig.json manipulation is NOT
// reimplemented here: the harness checkout ships scripts/ohif-plugin.mjs, and
// because that script resolves every path from its own location, importing it
// from .ohif/scripts/ points all of its subcommands (and the doctor) at
// .ohif/platform/app/pluginConfig.json automatically.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

const WORKSPACE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MANIFEST_PATH = path.join(WORKSPACE_ROOT, 'ohif.config.json');
const HARNESS_DIR = path.join(WORKSPACE_ROOT, '.ohif');
const HARNESS_PLUGIN_SCRIPT = path.join(HARNESS_DIR, 'scripts', 'ohif-plugin.mjs');
const HARNESS_APP_CONFIG = path.join(
  HARNESS_DIR,
  'platform',
  'app',
  'public',
  'config',
  'workspace.js'
);
const OHIF_REPO_URL = process.env.OHIF_REPO_URL || 'https://github.com/OHIF/Viewers.git';

const USAGE = `usage: node scripts/ohif.mjs <subcommand>

subcommands:
  dev                    ensure the harness, then start the dev server
  build                  ensure the harness, then build the viewer
  doctor                 plugin config health checks
  plugin <subcommand>    harness plugin helper (add/remove/list/link/unlink/doctor)
  harness ensure         clone the pinned tag, install, link plugins, sync config
  harness upgrade <tag>  re-pin the manifest to <tag>, re-clone, re-link, doctor
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

// Write a `directory` pluginConfig entry per manifest plugin so the harness
// build source-compiles the workspace's plugin folders.
async function linkManifestPlugins(manifest) {
  const helper = await loadHarnessPluginModule();
  const config = helper.readConfig();
  let changed = false;
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
        changed = true;
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
    // directoryValueFor emits the harness build's directory grammar with
    // forward slashes; workspace folders live outside .ohif/, so this is an
    // absolute path.
    const directory = helper.directoryValueFor(absDir);
    const list = config[section] || (config[section] = []);
    const existing = list.find(entry => entry && entry.packageName === plugin.packageName);
    if (existing) {
      if (existing.directory !== directory) {
        existing.directory = directory;
        changed = true;
      }
    } else {
      list.push({ packageName: plugin.packageName, directory });
      changed = true;
    }
    console.log(`linked ${plugin.packageName} -> ${directory}`);
  }
  if (changed) {
    helper.writeConfig(config);
  }
}

// Sync the committed app config into the harness's public config directory,
// where the dev server and build resolve APP_CONFIG=config/workspace.js.
function syncAppConfig(manifest) {
  const source = path.join(WORKSPACE_ROOT, manifest.appConfig || 'config/app-config.js');
  if (!fs.existsSync(source)) {
    die(1, `app config not found: ${source} (manifest "appConfig")`);
  }
  fs.mkdirSync(path.dirname(HARNESS_APP_CONFIG), { recursive: true });
  fs.copyFileSync(source, HARNESS_APP_CONFIG);
  console.log(`synced ${path.relative(WORKSPACE_ROOT, source)} -> .ohif/platform/app/public/config/workspace.js`);
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
  await linkManifestPlugins(manifest);
  syncAppConfig(manifest);
}

async function cmdDev() {
  await harnessEnsure();
  console.log('starting the harness dev server (APP_CONFIG=config/workspace.js)');
  run('pnpm', ['run', 'dev'], {
    cwd: HARNESS_DIR,
    env: { ...process.env, APP_CONFIG: 'config/workspace.js' },
  });
}

async function cmdBuild() {
  await harnessEnsure();
  console.log('building the viewer (APP_CONFIG=config/workspace.js)');
  run('pnpm', ['run', 'build'], {
    cwd: HARNESS_DIR,
    env: { ...process.env, APP_CONFIG: 'config/workspace.js' },
  });
  console.log('build output: .ohif/platform/app/dist (the Dockerfile packages it with nginx)');
}

async function cmdPlugin(args) {
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
