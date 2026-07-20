#!/usr/bin/env node
// scripts/ohif-plugin.mjs
//
// Dependency-free helper for managing platform/app/pluginConfig.json.
// Replaces the platform/cli config-mutation flows (add/remove/link/unlink)
// and adds `doctor` (config health checks) and `list`.
//
// Uses node: built-ins only. The one non-built-in it touches at runtime is
// the real `semver` package (resolved from platform/app's resolution paths,
// never a dependency of this script) so the doctor's range verdicts are
// bit-identical to the runtime loader's semver check.
//
// Invariant: the config file is only ever written by an explicit subcommand
// (add/remove/link/unlink). list and doctor are strictly read-only.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';

export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const CONFIG_PATH = path.join(REPO_ROOT, 'platform', 'app', 'pluginConfig.json');
const APP_SRC_DIR = path.join(REPO_ROOT, 'platform', 'app', 'src');
const WRITE_PLUGIN_IMPORTS = path.join(REPO_ROOT, 'platform', 'app', '.rspack', 'writePluginImportsFile.js');

// Packages the host must own as singletons (the WS4 dedupe-alias set:
// react, react-dom, react/jsx-runtime resolve under the react/react-dom
// directories). A copy inside a directory-linked plugin's own node_modules
// can still be picked up through subpath imports (e.g. react-dom/client),
// which the exact-match aliases do not cover — so doctor warns on presence.
export const HOST_SINGLETON_PACKAGES = [
  'react',
  'react-dom',
  '@ohif/core',
  '@ohif/ui-next',
  '@cornerstonejs/core',
  '@cornerstonejs/tools',
];

export const readConfig = (configPath = CONFIG_PATH) =>
  JSON.parse(fs.readFileSync(configPath, 'utf8'));
// 2-space indent + trailing newline: reproduces the established formatting of
// the file (and of the CLI this replaces) so mutations produce minimal diffs.
export const serializeConfig = c => JSON.stringify(c, null, 2) + '\n';
export const writeConfig = (c, configPath = CONFIG_PATH) =>
  fs.writeFileSync(configPath, serializeConfig(c));

// 'pkg@range' -> { name, range } ; survives scopes ('@scope/pkg@^1.0.0').
export function splitSpec(spec) {
  const at = spec.lastIndexOf('@');
  if (at > 0) {
    return { name: spec.slice(0, at), range: spec.slice(at + 1) };
  }
  return { name: spec, range: undefined };
}

// Section detection: the CLI's keyword convention. In-tree modes carry
// 'ohif-mode' but in-tree extensions have no keywords, so when keywords are
// absent the caller must pass --extension or --mode.
export function sectionFromKeywords(keywords) {
  if (Array.isArray(keywords)) {
    if (keywords.includes('ohif-mode')) return 'modes';
    if (keywords.includes('ohif-extension')) return 'extensions';
  }
  return undefined;
}

function sectionFromFlags(args) {
  const wantsExtension = args.includes('--extension');
  const wantsMode = args.includes('--mode');
  if (wantsExtension && wantsMode) {
    die(2, 'pass only one of --extension or --mode');
  }
  if (wantsExtension) return 'extensions';
  if (wantsMode) return 'modes';
  return undefined;
}

function requireSection(pkgName, keywords, flagSection) {
  const section = flagSection || sectionFromKeywords(keywords);
  if (!section) {
    die(
      2,
      `${pkgName}: cannot determine section from package keywords — pass --extension or --mode`
    );
  }
  return section;
}

// Mirrors the build's directory grammar (writePluginImportsFile.js):
// './x' -> repo root, '~/x' -> home dir, anything else is used verbatim.
export function fromDirectory(dirPath) {
  if (!dirPath) return undefined;
  if (dirPath[0] === '.') return path.join(APP_SRC_DIR, '../../..') + dirPath.substring(1);
  if (dirPath[0] === '~') return os.homedir() + dirPath.substring(1);
  return dirPath;
}

function readJsonSafe(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return undefined;
  }
}

// In-tree workspace scan: package name -> 'extensions/<dir>' | 'modes/<dir>'.
export function getWorkspacePluginDirs() {
  const map = {};
  for (const group of ['extensions', 'modes']) {
    const root = path.join(REPO_ROOT, group);
    if (!fs.existsSync(root)) continue;
    for (const dir of fs.readdirSync(root)) {
      const pkg = readJsonSafe(path.join(root, dir, 'package.json'));
      if (pkg && pkg.name) {
        map[pkg.name] = `${group}/${dir}`;
      }
    }
  }
  return map;
}

// Source classification per entry, mirroring the build's resolution order:
// (1) entry.directory, (2) in-tree workspace, (3) root node_modules, else MISSING.
export function classifySource(entry, workspaceDirs = getWorkspacePluginDirs()) {
  const name = entry.packageName;
  if (entry.directory) {
    const abs = fromDirectory(entry.directory);
    const ok = abs && fs.existsSync(path.join(abs, 'package.json'));
    return { kind: 'directory', label: `directory: ${entry.directory}`, dir: ok ? abs : undefined };
  }
  const workspaceRel = name && workspaceDirs[name];
  if (workspaceRel) {
    return {
      kind: 'workspace',
      label: `workspace: ${workspaceRel}`,
      dir: path.join(REPO_ROOT, workspaceRel),
    };
  }
  const nm = name && path.join(REPO_ROOT, 'node_modules', name);
  if (nm && fs.existsSync(path.join(nm, 'package.json'))) {
    return { kind: 'node_modules', label: 'node_modules', dir: nm };
  }
  return { kind: 'missing', label: 'MISSING', dir: undefined };
}

// Stored `directory` values always use forward slashes so they round-trip
// through the build's fromDirectory grammar on every platform.
export function directoryValueFor(absPath) {
  const abs = path.resolve(absPath);
  const rel = path.relative(REPO_ROOT, abs);
  if (rel && !rel.startsWith('..') && !path.isAbsolute(rel)) {
    return './' + rel.split(path.sep).join('/');
  }
  return abs.split(path.sep).join('/');
}

function runPnpm(args) {
  // .cmd shims on win32 need a shell under current Node versions.
  execFileSync('pnpm', args, {
    cwd: REPO_ROOT,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
}

const defaultCtx = () => ({
  configPath: CONFIG_PATH,
  rootPkgPath: path.join(REPO_ROOT, 'package.json'),
  nodeModulesDir: path.join(REPO_ROOT, 'node_modules'),
  runPnpm,
});

function isRootDependency(name, rootPkgPath) {
  const rootPkg = readJsonSafe(rootPkgPath) || {};
  return Boolean(
    (rootPkg.dependencies && rootPkg.dependencies[name]) ||
      (rootPkg.devDependencies && rootPkg.devDependencies[name])
  );
}

function die(code, message) {
  console.error(message);
  process.exit(code);
}

// ---------------------------------------------------------------------------
// Subcommands
// ---------------------------------------------------------------------------

export function cmdAdd(args, ctx = defaultCtx()) {
  const spec = args.find(a => !a.startsWith('--'));
  if (!spec) die(2, 'usage: plugin add <pkg>[@range] [--extension|--mode]');
  const flagSection = sectionFromFlags(args);
  const { name } = splitSpec(spec);

  // One-command form: install to the root workspace (where the build's
  // node_modules fallback resolves from) only when not already a root dep.
  if (!isRootDependency(name, ctx.rootPkgPath)) {
    try {
      ctx.runPnpm(['add', '-w', spec]);
    } catch (e) {
      process.exit(typeof e.status === 'number' ? e.status : 1);
    }
  } else {
    console.log(`${name} is already a root dependency — skipping pnpm add`);
  }

  const pkg = readJsonSafe(path.join(ctx.nodeModulesDir, name, 'package.json'));
  if (!pkg) {
    die(1, `${name}: not found in node_modules after install — cannot determine section`);
  }
  const section = requireSection(name, pkg.keywords, flagSection);

  const config = readConfig(ctx.configPath);
  const list = config[section] || (config[section] = []);
  if (list.some(entry => entry && entry.packageName === name)) {
    console.log(`${name} is already declared in "${section}" — leaving the entry untouched`);
  } else {
    list.push({ packageName: name });
    writeConfig(config, ctx.configPath);
    console.log(`added { "packageName": "${name}" } to "${section}" in ${ctx.configPath}`);
  }
  return cmdDoctor([], ctx);
}

export function cmdRemove(args, ctx = defaultCtx()) {
  const name = args.find(a => !a.startsWith('--'));
  if (!name) die(2, 'usage: plugin remove <pkg>');

  const config = readConfig(ctx.configPath);
  let removed = false;
  for (const section of ['extensions', 'modes']) {
    const list = config[section] || [];
    const i = list.findIndex(entry => entry && entry.packageName === name);
    if (i !== -1) {
      list.splice(i, 1);
      removed = true;
      console.log(`removed ${name} from "${section}"`);
      break;
    }
  }
  if (!removed) {
    die(1, `${name} is not declared in pluginConfig.json`);
  }
  writeConfig(config, ctx.configPath);

  if (isRootDependency(name, ctx.rootPkgPath)) {
    try {
      ctx.runPnpm(['remove', '-w', name]);
    } catch (e) {
      process.exit(typeof e.status === 'number' ? e.status : 1);
    }
  } else {
    console.log('no root dependency to remove (workspace or directory-linked package)');
  }
  return cmdDoctor([], ctx);
}

export function cmdList(args, ctx = defaultCtx()) {
  const config = readConfig(ctx.configPath);
  const workspaceDirs = getWorkspacePluginDirs();
  const rows = [];
  for (const section of ['extensions', 'modes']) {
    for (const entry of config[section] || []) {
      rows.push({
        section,
        name: entry.packageName || JSON.stringify(entry),
        enabled: entry.default !== false ? 'enabled' : 'disabled',
        source: classifySource(entry, workspaceDirs).label,
      });
    }
  }
  const nameW = Math.max(...rows.map(r => r.name.length), 4);
  const enW = 'disabled'.length;
  for (const section of ['extensions', 'modes']) {
    console.log(`${section}:`);
    for (const r of rows.filter(r => r.section === section)) {
      console.log(`  ${r.name.padEnd(nameW)}  ${r.enabled.padEnd(enW)}  ${r.source}`);
    }
  }
  if ((config.public || []).length) {
    console.log('public:');
    for (const entry of config.public) {
      const label = entry.packageName || entry.directory;
      const details = [
        entry.packageName && entry.directory ? `directory: ${entry.directory}` : undefined,
        entry.to ? `to: ${entry.to}` : undefined,
      ]
        .filter(Boolean)
        .join('  ');
      console.log(`  ${label}${details ? '  ' + details : ''}`);
    }
  }
  return 0;
}

export function cmdLink(args, ctx = defaultCtx()) {
  const rawPath = args.find(a => !a.startsWith('--'));
  if (!rawPath) die(2, 'usage: plugin link <path> [--extension|--mode]');
  const flagSection = sectionFromFlags(args);
  const abs = path.resolve(process.cwd(), rawPath);
  const pkg = readJsonSafe(path.join(abs, 'package.json'));
  if (!pkg || !pkg.name) {
    die(1, `${abs}: no readable package.json with a "name" field`);
  }
  const section = requireSection(pkg.name, pkg.keywords, flagSection);
  const directory = directoryValueFor(abs);

  const config = readConfig(ctx.configPath);
  const list = config[section] || (config[section] = []);
  const existing = list.find(entry => entry && entry.packageName === pkg.name);
  if (existing) {
    existing.directory = directory; // upsert in place; preserves the default flag
  } else {
    list.push({ packageName: pkg.name, directory });
  }
  writeConfig(config, ctx.configPath);
  console.log(
    `linked in "${section}": ` +
      JSON.stringify(existing || { packageName: pkg.name, directory })
  );
  return cmdDoctor([], ctx);
}

export function cmdUnlink(args, ctx = defaultCtx()) {
  const arg = args.find(a => !a.startsWith('--'));
  if (!arg) die(2, 'usage: plugin unlink <name-or-path>');
  let name = arg;
  if (arg.includes('/') || arg.includes(path.sep)) {
    const pkg = readJsonSafe(path.resolve(process.cwd(), arg, 'package.json'));
    if (pkg && pkg.name) {
      name = pkg.name;
    }
  }
  const config = readConfig(ctx.configPath);
  for (const section of ['extensions', 'modes']) {
    const list = config[section] || [];
    const i = list.findIndex(entry => entry && entry.packageName === name);
    if (i === -1) continue;
    if (!list[i].directory) {
      die(1, `${name} is declared but not directory-linked — use: pnpm plugin remove ${name}`);
    }
    list.splice(i, 1);
    writeConfig(config, ctx.configPath);
    console.log(`unlinked ${name} (entry removed from "${section}")`);
    return 0;
  }
  die(1, `${name} is not declared in pluginConfig.json`);
}

// ---------------------------------------------------------------------------
// doctor
// ---------------------------------------------------------------------------

export function cmdDoctor(args, ctx = defaultCtx()) {
  let failed = false;
  const ok = msg => console.log(`[ok]   ${msg}`);
  const warn = msg => console.log(`[warn] ${msg}`);
  const skip = msg => console.log(`[skip] ${msg}`);
  const fail = msg => {
    failed = true;
    console.log(`[FAIL] ${msg}`);
  };

  // (a) parse
  let config;
  try {
    config = readConfig(ctx.configPath);
    ok(`parse: ${path.relative(REPO_ROOT, ctx.configPath)} is valid JSON`);
  } catch (e) {
    fail(`parse: ${e.message}`);
    return 1;
  }

  // (b) schema — single source of truth: reuse the build's validator.
  const cjsRequire = createRequire(import.meta.url);
  try {
    const { validatePluginConfig } = cjsRequire(WRITE_PLUGIN_IMPORTS);
    const errors = validatePluginConfig(config);
    if (errors.length) {
      errors.forEach(e => fail(`schema: ${e}`));
    } else {
      ok('schema: matches pluginConfig.schema.json (build validator)');
    }
  } catch (e) {
    fail(`schema: ${e.message}`);
  }

  // (c) resolution
  const workspaceDirs = getWorkspacePluginDirs();
  const resolved = []; // { entry, section, source }
  let unresolvable = 0;
  for (const section of ['extensions', 'modes']) {
    for (const entry of config[section] || []) {
      const source = classifySource(entry, workspaceDirs);
      if (source.kind === 'missing' || !source.dir) {
        unresolvable++;
        const hint = entry.directory
          ? `fix or remove the "directory" value (${entry.directory})`
          : `pnpm add -w ${entry.packageName}`;
        fail(`resolution: ${entry.packageName} is unresolvable — ${hint}`);
      } else {
        resolved.push({ entry, section, source });
      }
    }
  }
  if (!unresolvable) {
    ok(`resolution: all ${resolved.length} declared plugins resolve to a package.json`);
  }

  // (d) @ohif/core peer range against the host version.
  // Host version source is version.txt (what the build stamps into
  // process.env.VERSION_NUMBER and what the runtime loader checks), NOT
  // platform/core/package.json — warn when the two disagree.
  let hostVersion;
  try {
    hostVersion = fs.readFileSync(path.join(REPO_ROOT, 'version.txt'), 'utf8').trim();
  } catch (e) {
    fail(`host version: cannot read version.txt — ${e.message}`);
  }
  const corePkg = readJsonSafe(path.join(REPO_ROOT, 'platform', 'core', 'package.json'));
  if (hostVersion && corePkg && corePkg.version && corePkg.version !== hostVersion) {
    warn(
      `host version skew: version.txt has ${hostVersion} but platform/core/package.json has ` +
        `${corePkg.version} — the runtime loader checks version.txt`
    );
  }
  let semver;
  try {
    semver = createRequire(path.join(REPO_ROOT, 'platform', 'app', 'package.json'))('semver');
  } catch {
    semver = undefined;
  }
  if (!hostVersion) {
    // already failed above
  } else if (!semver) {
    skip('@ohif/core range checks: semver not resolvable from platform/app — run pnpm install');
  } else {
    for (const { entry, source } of resolved) {
      const pkg = readJsonSafe(path.join(source.dir, 'package.json'));
      if (!pkg) continue;
      const range =
        (pkg.peerDependencies && pkg.peerDependencies['@ohif/core']) ||
        (pkg.dependencies && pkg.dependencies['@ohif/core']);
      if (!range) {
        warn(`${entry.packageName} does not declare @ohif/core in peerDependencies`);
      } else if (range.startsWith('workspace:')) {
        // In-tree link; semver.satisfies() cannot evaluate workspace: ranges.
        ok(`${entry.packageName} @ohif/core "${range}" (workspace link)`);
      } else if (semver.satisfies(hostVersion, range, { includePrerelease: true })) {
        ok(`${entry.packageName} @ohif/core "${range}" satisfied by host ${hostVersion}`);
      } else {
        fail(`host @ohif/core ${hostVersion} does not satisfy "${range}" (${entry.packageName})`);
      }
    }
  }

  // (d2) GAP-4: a directory-linked plugin carrying its own copy of a
  // host-singleton package can duplicate it through subpath imports
  // (e.g. react-dom/client) that the exact-match dedupe aliases do not cover.
  for (const { entry, source } of resolved) {
    if (source.kind !== 'directory') continue;
    const locals = HOST_SINGLETON_PACKAGES.filter(name =>
      fs.existsSync(path.join(source.dir, 'node_modules', name))
    );
    if (locals.length) {
      warn(
        `${entry.packageName}: its node_modules contains host-singleton package(s) ` +
          `${locals.join(', ')} — subpath imports (e.g. react-dom/client) can load the local ` +
          `copy instead of the host's; declare them as peerDependencies and remove the local ` +
          `install (template .npmrc uses auto-install-peers=false)`
      );
    }
  }

  const declared = new Set(
    [...(config.extensions || []), ...(config.modes || [])]
      .map(entry => entry && entry.packageName)
      .filter(Boolean)
  );

  // (d3) B1: dangling references after `plugin remove` — a declared mode
  // peer-requiring a plugin that is no longer declared (or no longer
  // resolvable at all) only breaks later, at build/mode-registration time.
  // A peer counts as a plugin when it resolves to a package carrying an
  // ohif-extension/ohif-mode keyword, lives in the in-tree extensions/ or
  // modes/ workspaces, or follows the @ohif/extension-*|@ohif/mode-* naming
  // convention (the only signal left when the package was fully uninstalled).
  for (const { entry, source } of resolved) {
    const pkg = readJsonSafe(path.join(source.dir, 'package.json'));
    if (!pkg) continue;
    for (const peerName of Object.keys(pkg.peerDependencies || {})) {
      if (peerName === entry.packageName || declared.has(peerName)) continue;
      const peerSource = classifySource({ packageName: peerName }, workspaceDirs);
      const peerPkg = peerSource.dir
        ? readJsonSafe(path.join(peerSource.dir, 'package.json'))
        : undefined;
      const isPlugin =
        (peerPkg && sectionFromKeywords(peerPkg.keywords)) ||
        workspaceDirs[peerName] ||
        /^@ohif\/(extension|mode)-/.test(peerName);
      if (!isPlugin) continue; // library peer (react, @ohif/core, ...)
      const detail = peerSource.dir
        ? 'installed but no longer declared in pluginConfig.json'
        : 'neither declared nor resolvable';
      fail(
        `dangling reference: ${entry.packageName} peer-requires ${peerName}, which is ` +
          `${detail} — re-add it (pnpm plugin add ${peerName}) or remove ${entry.packageName}`
      );
    }
  }

  // (e) installed-but-undeclared keyword report (never writes the config).
  const reportUndeclared = (name, keyword) => {
    const target = keyword === 'ohif-mode' ? 'modes' : 'extensions';
    warn(
      `${name} (keyword ${keyword}) is installed but not declared — add to "${target}" in ` +
        `platform/app/pluginConfig.json:\n        { "packageName": "${name}" }`
    );
  };
  const scanPackageDir = pkgDir => {
    const pkg = readJsonSafe(path.join(pkgDir, 'package.json'));
    if (!pkg || !pkg.name || declared.has(pkg.name)) return;
    const keyword = Array.isArray(pkg.keywords)
      ? pkg.keywords.find(k => k === 'ohif-extension' || k === 'ohif-mode')
      : undefined;
    if (keyword) {
      reportUndeclared(pkg.name, keyword);
    }
  };
  if (fs.existsSync(ctx.nodeModulesDir)) {
    for (const name of fs.readdirSync(ctx.nodeModulesDir)) {
      if (name.startsWith('.')) continue;
      const full = path.join(ctx.nodeModulesDir, name);
      if (name.startsWith('@')) {
        let scoped = [];
        try {
          scoped = fs.readdirSync(full);
        } catch {
          // unreadable scope dir; ignore
        }
        for (const sub of scoped) {
          scanPackageDir(path.join(full, sub));
        }
      } else {
        scanPackageDir(full);
      }
    }
  }
  // In-tree workspaces are only discovered through explicit entries, so an
  // undeclared extensions/* or modes/* checkout silently never loads.
  for (const [name, rel] of Object.entries(workspaceDirs)) {
    if (declared.has(name)) continue;
    const target = rel.startsWith('modes/') ? 'modes' : 'extensions';
    warn(
      `${name} (in-tree ${rel}) is not declared — add to "${target}" in ` +
        `platform/app/pluginConfig.json:\n        { "packageName": "${name}" }`
    );
  }

  return failed ? 1 : 0;
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

const USAGE = `usage: node scripts/ohif-plugin.mjs <subcommand>

subcommands:
  add <pkg>[@range] [--extension|--mode]   install to the root workspace (pnpm add -w)
                                           when absent, declare it in pluginConfig.json,
                                           then run doctor
  remove <pkg>                             remove the declaration; pnpm remove -w when it
                                           is a root dependency; then run doctor
  list                                     print declared extensions/modes with source
  link <path> [--extension|--mode]         declare an out-of-tree checkout via "directory"
  unlink <name-or-path>                    remove a directory-linked declaration
  doctor                                   config health checks (exit 1 on any FAIL)
`;

export function main(argv = process.argv.slice(2)) {
  const [subcommand, ...rest] = argv;
  const commands = {
    add: cmdAdd,
    remove: cmdRemove,
    list: cmdList,
    link: cmdLink,
    unlink: cmdUnlink,
    doctor: cmdDoctor,
  };
  const command = commands[subcommand];
  if (!command) {
    console.error(USAGE);
    process.exit(2);
  }
  process.exit(command(rest) || 0);
}

const invokedDirectly =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  main();
}
