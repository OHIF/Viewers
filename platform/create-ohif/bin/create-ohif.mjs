#!/usr/bin/env node
// create-ohif: scaffolds OHIF workspaces, extensions, modes, and deployment configs.
//
// Single-file ESM bin. Imports only node builtins plus @clack/prompts, which is
// loaded lazily and ONLY for the interactive prompt flow, so fully-flagged
// (non-interactive) invocations work even before dependencies are installed.
//
// Template trees live in ../templates/<template>/. Dotfiles cannot ship inside
// an npm tarball (npm pack always excludes .npmrc and consumes nested
// .gitignore files as ignore-rule sources), so templates store them with a
// single leading underscore (_npmrc, _gitignore, _rspack/) and the rename pass
// below restores the dot. Double-underscore names (src/__tests__) are left
// untouched.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const selfPkg = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

const TEMPLATES = ['workspace', 'extension', 'mode', 'deployment'];
const NAME_RE = /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/;
const SCOPE_RE = /^@[a-z0-9-~][a-z0-9-._~]*$/;

// The module table: multiselect options, --modules validation,
// marker pruning, and file deletion all key off this map.
const MODULES = {
  viewport: {
    hint: 'render a display set (getViewportModule)',
    files: ['src/getViewportModule.tsx', 'src/viewports/ExampleViewport.tsx'],
  },
  panel: {
    hint: 'side panel (getPanelModule)',
    files: ['src/getPanelModule.tsx', 'src/panels/ExamplePanel.tsx'],
  },
  commands: {
    hint: 'commands (getCommandsModule)',
    files: ['src/commandsModule.ts'],
  },
  sopClassHandler: {
    hint: 'claim series into display sets (getSopClassHandlerModule)',
    files: ['src/getSopClassHandlerModule.ts'],
  },
  toolbar: {
    hint: 'toolbar evaluators (getToolbarModule)',
    files: ['src/getToolbarModule.tsx'],
  },
  hangingProtocol: {
    hint: 'hanging protocols (getHangingProtocolModule)',
    files: ['src/getHangingProtocolModule.ts'],
  },
};
const MODULE_KEYS = Object.keys(MODULES);

const USAGE = `create-ohif ${selfPkg.version}

Usage: create-ohif [name] [options]
       create-ohif migrate <path> [--dry-run]

  -t, --template <workspace|extension|mode|deployment>
      --scope <@scope>   prepended when the positional name is unscoped; quote it ('@acme')
      --modules <csv>    extension only; subset of: ${MODULE_KEYS.join(',')}
      --in-tree          scaffold into extensions/|modes/ of the enclosing OHIF checkout
      --dir <path>       parent folder for the new package's folder (default: the
                         current folder); ignored with --in-tree
  -y, --yes              non-interactive; requires name and --template;
                         defaults: modules=viewport, description auto
      --help             print this message
      --version          print the create-ohif version

migrate: ports a CLI-era (ohif-cli) standalone extension or mode at <path> to the
current plugin contract. --dry-run prints the full migration report without
touching any file; that report is the migration checklist.
`;

function fail(message) {
  console.error(message);
  process.exit(1);
}

function findAncestor(startDir, predicate) {
  let dir = path.resolve(startDir);
  for (;;) {
    if (predicate(dir)) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      return null;
    }
    dir = parent;
  }
}

// OHIF checkout detection: a directory containing BOTH markers.
function findCheckoutRoot(from) {
  return findAncestor(
    from,
    dir =>
      fs.existsSync(path.join(dir, 'pnpm-workspace.yaml')) &&
      fs.existsSync(path.join(dir, 'platform', 'app', 'pluginConfig.json'))
  );
}

// Workspace detection: a directory containing the committed manifest.
function findWorkspaceRoot(from) {
  return findAncestor(from, dir => fs.existsSync(path.join(dir, 'ohif.config.json')));
}

// Peer range for standalone scaffolds: ">=<major>.<minor>.0-beta.0 <<major+1>".
// A caret prerelease range (^3.13.0-beta.N) would exclude both earlier-beta
// hosts (version.txt lags the manifest version) and the eventual stable line.
function hostPeerRange(version) {
  const [major, minor] = version.split('.');
  return `>=${major}.${minor}.0-beta.0 <${Number(major) + 1}`;
}

function parseModulesCsv(csv) {
  const keys = csv
    .split(',')
    .map(part => part.trim())
    .filter(Boolean);
  const unknown = keys.filter(key => !MODULE_KEYS.includes(key));
  if (unknown.length > 0) {
    fail(`Unknown module(s): ${unknown.join(', ')}. Allowed: ${MODULE_KEYS.join(', ')}`);
  }
  return [...new Set(keys)];
}

async function loadPrompts() {
  try {
    return await import('@clack/prompts');
  } catch {
    fail(
      'Interactive prompts need the @clack/prompts dependency, which is not installed.\n' +
        'Either install dependencies (pnpm install) or run non-interactively with flags:\n\n' +
        USAGE
    );
  }
}

// ---------------------------------------------------------------------------
// Copy / rename / substitute engine
// ---------------------------------------------------------------------------

function listEntries(root) {
  const out = [];
  const walk = dir => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const entryPath = path.join(dir, entry.name);
      out.push({ path: entryPath, isDirectory: entry.isDirectory() });
      if (entry.isDirectory()) {
        walk(entryPath);
      }
    }
  };
  walk(root);
  return out;
}

function listFiles(root) {
  return listEntries(root)
    .filter(entry => !entry.isDirectory)
    .map(entry => entry.path);
}

// Rename pass: a single leading underscore becomes a dot (_npmrc -> .npmrc,
// _rspack/ -> .rspack/). Deepest-first so children keep valid paths while
// their parent directory is renamed. __double-underscore names are untouched.
function renamePass(root) {
  const entries = listEntries(root).sort((a, b) => b.path.length - a.path.length);
  for (const entry of entries) {
    const base = path.basename(entry.path);
    if (/^_(?!_)/.test(base)) {
      fs.renameSync(entry.path, path.join(path.dirname(entry.path), `.${base.slice(1)}`));
    }
  }
}

// Substitution pass: every emitted file is UTF-8 text (template invariant).
function substitutePass(root, tokens) {
  for (const file of listFiles(root)) {
    const text = fs.readFileSync(file, 'utf8');
    let next = text;
    for (const [token, value] of Object.entries(tokens)) {
      next = next.replaceAll(`{{${token}}}`, value);
    }
    if (next !== text) {
      fs.writeFileSync(file, next);
    }
  }
}

// Module pruning pass (extension only): delete unselected module files,
// drop their marker blocks from src/index.tsx wholesale, and strip the bare
// marker lines of selected modules.
function pruneModulesPass(targetDir, selectedModules) {
  for (const [key, def] of Object.entries(MODULES)) {
    if (selectedModules.includes(key)) {
      continue;
    }
    for (const rel of def.files) {
      fs.rmSync(path.join(targetDir, rel), { force: true });
    }
  }
  // Drop now-empty directories under src/ (e.g. src/viewports after pruning).
  const srcDir = path.join(targetDir, 'src');
  const dirs = listEntries(srcDir)
    .filter(entry => entry.isDirectory)
    .sort((a, b) => b.path.length - a.path.length);
  for (const dir of dirs) {
    if (fs.readdirSync(dir.path).length === 0) {
      fs.rmdirSync(dir.path);
    }
  }

  const indexPath = path.join(targetDir, 'src', 'index.tsx');
  const lines = fs.readFileSync(indexPath, 'utf8').split('\n');
  const kept = [];
  let skippingKey = null;
  for (const line of lines) {
    const trimmed = line.trim();
    const open = trimmed.match(/^\/\/ <ohif-module:([A-Za-z]+)>$/);
    const close = trimmed.match(/^\/\/ <\/ohif-module:([A-Za-z]+)>$/);
    if (skippingKey !== null) {
      if (close && close[1] === skippingKey) {
        skippingKey = null;
      }
      continue;
    }
    if (open) {
      if (!selectedModules.includes(open[1])) {
        skippingKey = open[1];
      }
      continue; // marker line is dropped either way
    }
    if (close) {
      continue;
    }
    kept.push(line);
  }
  const result = kept.join('\n');
  if (result.includes('<ohif-module:')) {
    throw new Error('Internal error: a module marker survived the pruning pass in src/index.tsx');
  }
  fs.writeFileSync(indexPath, result);
}

// In-tree transform pass: monorepo root .npmrc/pnpm-workspace govern
// installs, and rspack/react/typescript/css tooling resolve from the hoisted
// root node_modules, so the scaffold keeps only the minimal devDeps.
function inTreeTransformPass(targetDir, checkoutRoot) {
  // The root's .npmrc and pnpm-workspace.yaml govern; a nested copy of the
  // standalone template's settings could make pnpm treat this folder as its
  // own workspace root when a command runs from inside it.
  fs.rmSync(path.join(targetDir, '.npmrc'), { force: true });
  fs.rmSync(path.join(targetDir, 'pnpm-workspace.yaml'), { force: true });
  const pkgPath = path.join(targetDir, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  // In-tree plugins are app-only: verify-tarballs requires every non-SDK
  // workspace package to be private, and they version in lockstep with the repo.
  pkg.private = true;
  const rootPkgPath = path.join(checkoutRoot, 'package.json');
  if (fs.existsSync(rootPkgPath)) {
    const rootVersion = JSON.parse(fs.readFileSync(rootPkgPath, 'utf8')).version;
    if (typeof rootVersion === 'string') {
      pkg.version = rootVersion;
    }
  }
  pkg.devDependencies = { 'cross-env': '7.0.3', vitest: '3.2.7' };
  if (pkg.scripts) {
    delete pkg.scripts.typecheck;
  }
  // The checkout's root package.json pins pnpm for every package in it.
  delete pkg.packageManager;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
}

function assertNoTokensPass(targetDir) {
  for (const file of listFiles(targetDir)) {
    if (fs.readFileSync(file, 'utf8').includes('{{')) {
      throw new Error(
        `Internal error: unsubstituted template token left in ${path.relative(targetDir, file)}`
      );
    }
  }
}

// Scaffolding an extension/mode inside a workspace appends it to the
// committed manifest so the harness links it on the next `pnpm dev`.
function appendToWorkspaceManifest(workspaceRoot, name, pluginFolder) {
  const manifestPath = path.join(workspaceRoot, 'ohif.config.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (!Array.isArray(manifest.plugins)) {
    manifest.plugins = [];
  }
  if (!manifest.plugins.some(plugin => plugin && plugin.packageName === name)) {
    manifest.plugins.push({ packageName: name, directory: `./${pluginFolder}` });
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  }
}

// ---------------------------------------------------------------------------
// Summary output
// ---------------------------------------------------------------------------

function relativeOrAbsolute(targetDir) {
  const relative = path.relative(process.cwd(), targetDir);
  return !relative || relative.startsWith('..') ? targetDir : relative;
}

function printSummary({ context, template, name, dirName, targetDir, checkoutRoot }) {
  const lines = [`\nScaffolded ${name} at ${targetDir}\n`];
  if (context === 'in-tree') {
    const section = template === 'extension' ? 'extensions' : 'modes';
    lines.push(
      `Add this line to platform/app/pluginConfig.json under "${section}":`,
      `  { "packageName": "${name}" }`,
      `Or run the automated alternative: pnpm plugin add ${name}`,
      '',
      'Then register the new workspace package (a deliberate lockfile update) and start the viewer:',
      '  pnpm run install:update-lockfile',
      '  pnpm dev',
      '',
      `(checkout root: ${checkoutRoot})`
    );
  } else if (context === 'workspace') {
    lines.push(
      'Added to ohif.config.json (the committed workspace manifest).',
      'Run `pnpm dev` at the workspace root to link it into the harness and start the viewer.'
    );
  } else if (template === 'workspace') {
    lines.push(
      'Next steps:',
      `  cd ${dirName} && pnpm install && pnpm dev`,
      '',
      'ohif.config.json is the committed manifest (pinned OHIF version, plugins, app config);',
      'the .ohif/ harness is machine-managed, gitignored, and disposable.'
    );
  } else if (template === 'deployment') {
    lines.push(
      'Next steps:',
      `  cd ${dirName}`,
      '  edit app-config.js, then: docker compose up'
    );
  } else {
    // Versioned path: the image serves /plugins/<name>/<version>/ as immutable.
    const scaffoldedVersion = JSON.parse(
      fs.readFileSync(path.join(targetDir, 'package.json'), 'utf8')
    ).version;
    const descriptor = [
      '  {',
      `    "packageName": "${name}",`,
      `    "importPath": "/plugins/${dirName}/${scaffoldedVersion}/index.umd.js",`,
      `    "globalName": "${name}",`,
      `    "coreVersionRange": "${hostPeerRange(selfPkg.version)}"`,
      '  }',
    ];
    lines.push(
      'Next steps:',
      `  cd ${relativeOrAbsolute(targetDir)} && pnpm install && pnpm build`,
      '',
      `Load at runtime (app-config.js, under "${template === 'extension' ? 'extensions' : 'modes'}"):`,
      ...descriptor,
      '',
      'The <version>/ path segment is optional. It is the convention the nginx config',
      'in the ohif/app image keys its cache rules off: versioned paths are sent as',
      'immutable (browsers keep them for a year; publish changes under a new version),',
      'unversioned paths as no-cache.',
      '',
      'Or link a local checkout via platform/app/pluginConfig.json (directory mode):',
      `  { "packageName": "${name}", "directory": "~/path/to/${dirName}" }`
    );
  }
  console.log(lines.join('\n'));
}

// ---------------------------------------------------------------------------
// migrate subcommand: port a CLI-era standalone extension/mode to the
// current plugin contract. Two report categories:
//   [rewrite] / [ok] — items migrate owns and applies automatically
//   [flag]           — items migrate must never rewrite (manual follow-up)
// --dry-run computes everything and prints the same report without writing;
// that report IS the migration checklist.
// ---------------------------------------------------------------------------

const CONTRACT_UMD = 'dist/index.umd.js';
const CONTRACT_FILES = ['dist', 'src', 'public', 'README.md'];
const CONTRACT_DEV_SCRIPT =
  'cross-env NODE_ENV=development rspack build --config .rspack/rspack.prod.js --watch';
const CONTRACT_BUILD_SCRIPT =
  'cross-env NODE_ENV=production rspack build --config .rspack/rspack.prod.js';
// Webpack-5-era build tooling: superseded wholesale by the .rspack/ config.
const WEBPACK_TOOLING = [
  'webpack',
  'webpack-cli',
  'webpack-merge',
  'babel-loader',
  'clean-webpack-plugin',
  'copy-webpack-plugin',
  '@svgr/webpack',
  'eslint-loader',
];
// Babel packages only babel.config.js uses, which the .rspack build ignores.
// They are named in the babel flag, never pinned. (babel-loader is in
// WEBPACK_TOOLING; babel-jest is left alone, since tests may still use Babel.)
const isBabelPackage = name => name.startsWith('@babel/') || /^babel-(plugin|preset)-/.test(name);
// devDependencies the vendored .rspack config needs at build time (extension
// additionally compiles CSS through postcss/tailwind).
// Exact pins, matching OHIF's convention (ranges only in peerDependencies) and
// the versions the monorepo itself builds with where it has them.
// An exact semver version, optionally with a prerelease tag (e.g. 3.14.0-beta.37).
const EXACT_VERSION = /^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/;
const MIGRATE_DEV_DEPS = {
  extension: {
    '@rspack/cli': '2.1.10',
    '@rspack/core': '2.1.10',
    'cross-env': '7.0.3',
    'css-loader': '6.11.0',
    postcss: '8.5.28',
    'postcss-loader': '8.2.1',
    tailwindcss: '3.2.4',
  },
  mode: {
    '@rspack/cli': '2.1.10',
    '@rspack/core': '2.1.10',
    'cross-env': '7.0.3',
  },
};
// The only @ohif deep imports the published contract resolves (ui-next
// subpath exports); everything else under @ohif/<pkg>/ is an internal.
const SANCTIONED_OHIF_SUBPATHS = [
  '@ohif/ui-next/tailwind.config',
  '@ohif/ui-next/lib/',
  '@ohif/ui-next/components/',
];

function detectPluginKind(pkg) {
  const keywords = Array.isArray(pkg.keywords) ? pkg.keywords : [];
  if (keywords.includes('ohif-mode')) {
    return 'mode';
  }
  if (keywords.includes('ohif-extension')) {
    return 'extension';
  }
  return /(^|[-/])modes?(-|$)/.test(pkg.name ?? '') ? 'mode' : 'extension';
}

function detectSourceEntry(targetDir, pkg) {
  const candidates = [];
  if (typeof pkg.module === 'string' && pkg.module.startsWith('src/')) {
    candidates.push(pkg.module);
  }
  candidates.push('src/index.tsx', 'src/index.ts', 'src/index.jsx', 'src/index.js');
  return candidates.find(rel => fs.existsSync(path.join(targetDir, rel))) ?? null;
}

// Flag-only source scan: @ohif/ui imports (ui-next APIs differ), deep imports
// of OHIF internals, and relative imports escaping the package root.
function scanSourceImports(targetDir, flags) {
  const srcDir = path.join(targetDir, 'src');
  if (!fs.existsSync(srcDir)) {
    return;
  }
  const importRe = /(?:\bfrom\s*|\brequire\s*\(\s*|\bimport\s*\(\s*|\bimport\s+)['"]([^'"]+)['"]/g;
  const files = listFiles(srcDir).filter(file => /\.(js|jsx|ts|tsx|mjs|cjs)$/.test(file));
  for (const file of files) {
    // Forward slashes regardless of platform: the report is user-facing and its
    // paths are asserted verbatim by the tests.
    const rel = path.relative(targetDir, file).split(path.sep).join('/');
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, index) => {
      for (const match of line.matchAll(importRe)) {
        const spec = match[1];
        const at = `${rel}:${index + 1}`;
        if (spec === '@ohif/ui' || spec.startsWith('@ohif/ui/')) {
          flags.push(
            `${at} imports "${spec}" — @ohif/ui is legacy and the host does not provide it to plugins; port to @ohif/ui-next by hand (the APIs differ)`
          );
        } else if (
          /^@ohif\/[^/]+\//.test(spec) &&
          !SANCTIONED_OHIF_SUBPATHS.some(
            prefix => spec === prefix || (prefix.endsWith('/') && spec.startsWith(prefix))
          )
        ) {
          flags.push(
            `${at} imports OHIF internals outside the contract ("${spec}") — only bare @ohif/<package> entry points are host-provided`
          );
        } else if (spec.startsWith('.')) {
          const resolved = path.resolve(path.dirname(file), spec);
          if (resolved !== targetDir && !resolved.startsWith(targetDir + path.sep)) {
            flags.push(
              `${at} imports "${spec}", which resolves outside the package root — move the file into the package or replace it with a contract dependency`
            );
          }
        }
      }
    });
  }
}

function readTemplateFile(kind, rel) {
  return fs.readFileSync(new URL(`../templates/${kind}/${rel}`, import.meta.url), 'utf8');
}

// Whether a JS/TS file under src/ or at the package root matches pattern.
// node_modules, dist and the .webpack/ config migrate replaces are not read.
function sourceMentions(targetDir, pattern) {
  const srcDir = path.join(targetDir, 'src');
  const files = [
    ...(fs.existsSync(srcDir)
      ? fs.readdirSync(srcDir, { recursive: true }).map(rel => path.join(srcDir, rel))
      : []),
    ...fs.readdirSync(targetDir).map(name => path.join(targetDir, name)),
  ];
  return files
    .filter(file => /\.[cm]?[jt]sx?$/.test(file) && fs.statSync(file).isFile())
    .some(file => pattern.test(fs.readFileSync(file, 'utf8')));
}

async function runMigrate(targetDir, dryRun) {
  targetDir = path.resolve(targetDir);
  const pkgPath = path.join(targetDir, 'package.json');
  if (!fs.existsSync(pkgPath)) {
    fail(`migrate: no package.json at ${targetDir}`);
  }
  let pkg;
  try {
    pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  } catch (error) {
    fail(`migrate: could not parse ${pkgPath}: ${error.message}`);
  }
  if (!pkg.name) {
    fail(`migrate: ${pkgPath} has no "name" field`);
  }

  const kind = detectPluginKind(pkg);
  const keyword = kind === 'extension' ? 'ohif-extension' : 'ohif-mode';
  const hostRange = hostPeerRange(selfPkg.version);
  const changes = []; // [rewrite]/[ok] lines, in checklist order
  const flags = []; // [flag] lines — never rewritten automatically
  const fileOps = []; // applied only when !dryRun, after package.json is written
  const next = JSON.parse(JSON.stringify(pkg));
  const note = (done, text) => changes.push(`${done ? '[rewrite]' : '[ok]     '} ${text}`);

  // -- package.json: main / module -----------------------------------------
  if (next.main !== CONTRACT_UMD) {
    note(
      true,
      `package.json main: ${JSON.stringify(next.main)} -> "${CONTRACT_UMD}" (the .rspack build emits dist/index.umd.js; the CLI-era dist/umd/<name>/ path is gone)`
    );
    next.main = CONTRACT_UMD;
  } else {
    note(false, `package.json main already "${CONTRACT_UMD}"`);
  }
  const entry = detectSourceEntry(targetDir, pkg);
  if (entry === null) {
    flags.push(
      'no src/index.{tsx,ts,jsx,js} entry found — the vendored .rspack/rspack.prod.js expects one; point its "entry" at your real entry file'
    );
  } else if (next.module !== entry) {
    note(
      true,
      `package.json module: ${JSON.stringify(next.module)} -> "${entry}" (working-tree module must point at the src entry; directory-mode loading resolves it)`
    );
    next.module = entry;
  } else {
    note(false, `package.json module already points at the src entry ("${entry}")`);
  }

  // -- package.json: files / keywords / publishConfig -----------------------
  if (JSON.stringify(next.files) !== JSON.stringify(CONTRACT_FILES)) {
    note(
      true,
      `package.json files: -> ${JSON.stringify(CONTRACT_FILES)} (src must ship for directory-mode consumers)`
    );
    next.files = [...CONTRACT_FILES];
  } else {
    note(false, `package.json files already ${JSON.stringify(CONTRACT_FILES)}`);
  }
  const keywords = Array.isArray(next.keywords) ? next.keywords : [];
  if (!keywords.includes(keyword)) {
    note(true, `package.json keywords: add "${keyword}" (registry discovery + plugin doctor key off it)`);
    next.keywords = [...keywords, keyword];
  } else {
    note(false, `package.json keywords already contains "${keyword}"`);
  }
  // The CLI template set repository to OHIF's own repo, so npm would link a
  // third-party plugin to OHIF/Viewers. Drop that value (a new scaffold has no
  // repository); any other value, or one with a directory (a package that does
  // live in that repo), is the author's and stays.
  const repoUrl =
    typeof next.repository === 'string'
      ? next.repository
      : next.repository && !next.repository.directory
        ? next.repository.url
        : undefined;
  const isOhifRepo =
    typeof repoUrl === 'string' &&
    /^(github:)?OHIF\/Viewers$|^(git\+)?https?:\/\/github\.com\/OHIF\/Viewers(\.git)?\/?$/i.test(
      repoUrl.trim()
    );
  if (isOhifRepo) {
    note(
      true,
      `package.json repository: drop ${JSON.stringify(repoUrl)} (the CLI template's value; npm would link to OHIF's repo) — add your own repository if you want npm to link to your source`
    );
    delete next.repository;
  }
  const publishConfig = { access: 'public', main: CONTRACT_UMD, module: CONTRACT_UMD };
  const mergedPublishConfig = { ...(next.publishConfig ?? {}), ...publishConfig };
  if (JSON.stringify(next.publishConfig) !== JSON.stringify(mergedPublishConfig)) {
    note(
      true,
      `package.json publishConfig: field overrides -> ${JSON.stringify(publishConfig)} (pnpm rewrites main/module at publish time; npm CLI ignores this — publish with pnpm)`
    );
    next.publishConfig = mergedPublishConfig;
  } else {
    note(false, 'package.json publishConfig already carries the dist overrides');
  }

  // -- package.json: engines -------------------------------------------------
  // engines.node follows the template unless the package already asks for a
  // higher floor (a single ">=" range at or above the template's major). The
  // CLI-era npm and yarn entries go: the package uses pnpm now.
  const templateNode = JSON.parse(readTemplateFile(kind, 'package.json')).engines.node;
  const engines = next.engines ?? {};
  const floorMajor = range => {
    const match = typeof range === 'string' && range.trim().match(/^>=\s*(\d+)(?:\.\d+){0,2}$/);
    return match ? Number(match[1]) : null;
  };
  if (engines.node === templateNode) {
    note(false, `package.json engines.node already "${templateNode}"`);
  } else if (floorMajor(engines.node) !== null && floorMajor(engines.node) >= floorMajor(templateNode)) {
    note(false, `package.json engines.node: keep ${JSON.stringify(engines.node)} (at or above the template's "${templateNode}")`);
  } else {
    note(true, `package.json engines.node: ${JSON.stringify(engines.node)} -> "${templateNode}" (the template's value)`);
    engines.node = templateNode;
  }
  for (const name of ['npm', 'yarn']) {
    if (name in engines) {
      note(true, `package.json engines.${name}: drop ${JSON.stringify(engines[name])} (the package uses pnpm)`);
      delete engines[name];
    }
  }
  next.engines = engines;

  // -- package.json: peerDependencies ---------------------------------------
  const peers = next.peerDependencies ?? {};
  if ('@ohif/ui' in peers) {
    note(
      true,
      'package.json peerDependencies: drop "@ohif/ui" (legacy; the host does not provide it to runtime plugins — use @ohif/ui-next)'
    );
    delete peers['@ohif/ui'];
  } else {
    note(false, 'package.json peerDependencies: no legacy "@ohif/ui" peer');
  }
  for (const name of Object.keys(peers)) {
    if (name.startsWith('@ohif/') && peers[name] !== hostRange) {
      note(
        true,
        `package.json peerDependencies["${name}"]: ${JSON.stringify(peers[name])} -> "${hostRange}" (the OHIF versions this plugin supports, taken from create-ohif's version)`
      );
      peers[name] = hostRange;
    }
  }
  if (!('@ohif/core' in peers)) {
    note(true, `package.json peerDependencies: add "@ohif/core": "${hostRange}"`);
    peers['@ohif/core'] = hostRange;
  }
  // React peers follow the current template (the 3.14 host runs React 19, and
  // its compiled components need React 19 APIs at runtime). Only rewritten when
  // declared; a package that never named React keeps not naming it.
  const templateReactPeers = JSON.parse(
    readTemplateFile('extension', 'package.json')
  ).peerDependencies;
  for (const name of ['react', 'react-dom']) {
    if (name in peers && peers[name] !== templateReactPeers[name]) {
      note(
        true,
        `package.json peerDependencies["${name}"]: ${JSON.stringify(peers[name])} -> "${templateReactPeers[name]}" (the host runs React 19)`
      );
      peers[name] = templateReactPeers[name];
    }
  }
  // React under dependencies is always moved: the host provides React, so an
  // installed copy would be a second React. It becomes a peer at the
  // template's range.
  const deps = next.dependencies ?? {};
  for (const name of ['react', 'react-dom']) {
    if (name in deps) {
      note(
        true,
        `package.json dependencies: move "${name}" ${JSON.stringify(deps[name])} to peerDependencies "${templateReactPeers[name]}" (the host provides React; an installed copy would be a second React)`
      );
      delete deps[name];
      peers[name] = templateReactPeers[name];
    }
  }
  if (next.dependencies) {
    next.dependencies = deps;
  }
  for (const name of WEBPACK_TOOLING) {
    if (name in peers) {
      note(
        true,
        `package.json peerDependencies: drop "${name}" (build tooling is never a peer; the .rspack toolchain lives in devDependencies)`
      );
      delete peers[name];
    }
  }
  next.peerDependencies = peers;

  // -- package.json: scripts -------------------------------------------------
  const scripts = next.scripts ?? {};
  if (scripts.dev !== CONTRACT_DEV_SCRIPT) {
    const brokenDev = typeof scripts.dev === 'string' && scripts.dev.includes('.webpack/webpack.dev.js');
    note(
      true,
      `package.json scripts.dev: -> "${CONTRACT_DEV_SCRIPT}"${
        brokenDev
          ? ' (the CLI-era dev script pointed at .webpack/webpack.dev.js, a file the CLI template never shipped — it was broken from day one)'
          : ''
      }`
    );
    scripts.dev = CONTRACT_DEV_SCRIPT;
  } else {
    note(false, 'package.json scripts.dev already the .rspack watch build');
  }
  if (scripts.build !== CONTRACT_BUILD_SCRIPT) {
    note(true, `package.json scripts.build: -> "${CONTRACT_BUILD_SCRIPT}"`);
    scripts.build = CONTRACT_BUILD_SCRIPT;
  } else {
    note(false, 'package.json scripts.build already the .rspack production build');
  }
  if (scripts['build:package'] !== 'pnpm run build') {
    note(true, 'package.json scripts["build:package"]: -> "pnpm run build"');
    scripts['build:package'] = 'pnpm run build';
  }
  // The CLI templates added an alias for dev (dev:my-extension in extensions,
  // dev:cornerstone in modes). The create-ohif templates have none and nothing
  // calls them, so drop them while they are still the unchanged alias.
  for (const alias of ['dev:my-extension', 'dev:cornerstone']) {
    if (typeof scripts[alias] === 'string' && /^(yarn|pnpm) run dev$/.test(scripts[alias])) {
      note(true, `package.json scripts["${alias}"]: drop (the CLI template's alias for dev; nothing calls it)`);
      delete scripts[alias];
    }
  }
  // The package now uses pnpm, so any remaining yarn call becomes pnpm run.
  // The `yarn <name>` shorthand is only rewritten when <name> is one of the
  // package's own scripts, so yarn commands like `yarn install` are left alone.
  for (const [name, command] of Object.entries(scripts)) {
    const match = typeof command === 'string' && command.match(/^yarn(?: run)? ([\w:.-]+)(.*)$/);
    if (match && (command.startsWith('yarn run ') || match[1] in scripts)) {
      const rewritten = `pnpm run ${match[1]}${match[2]}`;
      note(true, `package.json scripts["${name}"]: "${command}" -> "${rewritten}"`);
      scripts[name] = rewritten;
    }
  }
  // Any yarn call still left (a yarn command such as `yarn install`, or yarn
  // later in a command) has no safe automatic translation, so flag it.
  for (const [name, command] of Object.entries(scripts)) {
    if (typeof command === 'string' && /(^|[\s&;|])yarn(\s|$)/.test(command)) {
      flags.push(
        `package.json scripts["${name}"] still calls yarn ("${command}") — this package now uses pnpm; translate it by hand`
      );
    }
  }
  // A test script that runs jest without jest installed can only fail. Flag it
  // rather than delete it: the author may want tests (create-ohif scaffolds use
  // vitest).
  const declaresJest = 'jest' in (next.dependencies ?? {}) || 'jest' in (next.devDependencies ?? {});
  if (!declaresJest) {
    for (const [name, command] of Object.entries(scripts)) {
      if (typeof command === 'string' && /(^|[\s&;|])jest(\s|$)/.test(command)) {
        flags.push(
          `package.json scripts["${name}"] runs jest, which isn't a dependency — remove it, or set up tests with vitest as a new create-ohif scaffold does`
        );
      }
    }
  }
  next.scripts = scripts;

  // -- package.json: devDependencies -----------------------------------------
  const devDeps = next.devDependencies ?? {};
  const addedDevDeps = [];
  const pinnedDevDeps = [];
  for (const [name, range] of Object.entries(MIGRATE_DEV_DEPS[kind])) {
    if (!(name in devDeps)) {
      devDeps[name] = range;
      addedDevDeps.push(`${name}@${range}`);
    } else if (!EXACT_VERSION.test(devDeps[name])) {
      // A ranged entry for a package migrate pins: replace it with the pin. An
      // exact version the author chose is left alone.
      pinnedDevDeps.push(`${name} ${devDeps[name]} -> ${range}`);
      devDeps[name] = range;
    }
  }
  if (pinnedDevDeps.length > 0) {
    note(
      true,
      `package.json devDependencies: pin to exact versions (${pinnedDevDeps.join(', ')}) — OHIF uses exact versions outside peerDependencies`
    );
  }
  if (addedDevDeps.length > 0) {
    note(
      true,
      `package.json devDependencies: add .rspack toolchain (${addedDevDeps.join(', ')})`
    );
  } else {
    note(false, 'package.json devDependencies already carry the .rspack toolchain');
  }
  const removedDevDeps = WEBPACK_TOOLING.filter(name => name in devDeps);
  if (removedDevDeps.length > 0) {
    for (const name of removedDevDeps) {
      delete devDeps[name];
    }
    note(
      true,
      `package.json devDependencies: remove webpack-5 toolchain (${removedDevDeps.join(', ')}) — superseded by .rspack/`
    );
  }
  next.devDependencies = devDeps;

  // The CLI templates listed eslint, babel-eslint and dotenv, but nothing in
  // them ran those. When nothing in the package does either, say to remove
  // them instead of asking for a pin.
  const scriptsMention = pattern =>
    Object.values(scripts).some(command => typeof command === 'string' && pattern.test(command));
  const rootFiles = fs.readdirSync(targetDir);
  const eslintUsed =
    scriptsMention(/(^|[\s&;|])eslint(\s|$)/) ||
    'eslintConfig' in next ||
    rootFiles.some(name => /^\.eslintrc(\..+)?$|^eslint\.config\.[cm]?[jt]s$/.test(name));
  const dotenvUsed = scriptsMention(/\bdotenv\b/) || sourceMentions(targetDir, /\bdotenv\b/);
  const unusedTools = [
    ...(eslintUsed ? [] : ['eslint', 'babel-eslint']),
    ...(dotenvUsed ? [] : ['dotenv']),
  ];
  for (const section of ['dependencies', 'devDependencies']) {
    const unused = unusedTools.filter(name => name in (next[section] ?? {}));
    if (unused.length > 0) {
      const [verb, them] = unused.length === 1 ? ["isn't", 'it'] : ["aren't", 'them'];
      flags.push(
        `package.json ${section}: ${unused.join(', ')} ${verb} used by any script, config or source file — remove ${them} (or pin ${them} if you do use ${them})`
      );
    }
  }

  // Ranges migrate has no pin for: flag them by name rather than resolve a
  // version against the registry. Babel packages and the unused tools above
  // are skipped because the report already says to remove them.
  for (const section of ['dependencies', 'devDependencies']) {
    const ranged = Object.entries(next[section] ?? {})
      .filter(([name]) => !isBabelPackage(name) && !unusedTools.includes(name))
      .filter(([, spec]) => !EXACT_VERSION.test(spec))
      .filter(([, spec]) => !spec.startsWith('workspace:'))
      .map(([name, spec]) => `${name}@${spec}`);
    if (ranged.length > 0) {
      flags.push(
        `package.json ${section} not pinned to exact versions: ${ranged.join(', ')} — OHIF uses exact versions outside peerDependencies; pin them by hand`
      );
    }
  }

  // packageManager: flagged, never written. migrate can't tell whether the
  // package is its own project or sits inside a repo that already pins pnpm.
  // The version to suggest comes from the workspace template, which declares it.
  const templatePackageManager = JSON.parse(
    readTemplateFile('workspace', 'package.json')
  ).packageManager;
  if (!next.packageManager) {
    flags.push(
      `package.json has no "packageManager" — the pnpm settings above assume ${templatePackageManager}; add "packageManager": "${templatePackageManager}" unless a parent repo already pins pnpm`
    );
  } else if (next.packageManager !== templatePackageManager) {
    flags.push(
      `package.json "packageManager" is "${next.packageManager}" — the pnpm settings above assume ${templatePackageManager}; check that your package manager reads them`
    );
  }

  // -- build config: .webpack/ -> .rspack/ -----------------------------------
  const webpackDir = path.join(targetDir, '.webpack');
  const rspackDir = path.join(targetDir, '.rspack');
  const templateEntry = kind === 'extension' ? '../src/index.tsx' : '../src/index.ts';
  let rspackConfig = readTemplateFile(kind, '_rspack/rspack.prod.js');
  let entryNote = '';
  if (entry !== null && `../${entry}` !== templateEntry) {
    rspackConfig = rspackConfig.replace(`'${templateEntry}'`, `'../${entry}'`);
    entryNote = `; entry adapted to ../${entry}`;
  }
  const pluginExternals = readTemplateFile(kind, '_rspack/pluginExternals.js');
  const rspackUpToDate = [
    ['rspack.prod.js', rspackConfig],
    ['pluginExternals.js', pluginExternals],
  ].every(([name, content]) => {
    const existing = path.join(rspackDir, name);
    return fs.existsSync(existing) && fs.readFileSync(existing, 'utf8') === content;
  });
  if (rspackUpToDate) {
    note(false, '.rspack/rspack.prod.js + .rspack/pluginExternals.js already match the current template');
  } else {
    note(
      true,
      `write .rspack/rspack.prod.js + .rspack/pluginExternals.js (current template's Contract v1 build config with vendored pluginExternals${entryNote})`
    );
    fileOps.push(() => {
      fs.mkdirSync(rspackDir, { recursive: true });
      fs.writeFileSync(path.join(rspackDir, 'rspack.prod.js'), rspackConfig);
      fs.writeFileSync(path.join(rspackDir, 'pluginExternals.js'), pluginExternals);
    });
  }
  if (fs.existsSync(webpackDir)) {
    const recognized = [];
    for (const name of fs.readdirSync(webpackDir)) {
      if (name === 'webpack.prod.js' || name === 'webpack.dev.js') {
        recognized.push(name);
      } else {
        flags.push(
          `.webpack/${name} is unrecognized custom build config — left in place; port any custom settings into .rspack/rspack.prod.js by hand`
        );
      }
    }
    if (recognized.length > 0) {
      note(
        true,
        `remove webpack-5 config ${recognized.map(name => `.webpack/${name}`).join(', ')} (replaced by .rspack/; the old config's output.library was declared twice, so it never reliably emitted the documented UMD)`
      );
      fileOps.push(() => {
        for (const name of recognized) {
          fs.rmSync(path.join(webpackDir, name), { force: true });
        }
        if (fs.readdirSync(webpackDir).length === 0) {
          fs.rmdirSync(webpackDir);
        }
      });
    }
  }
  for (const name of [
    'webpack.config.js',
    'vite.config.js',
    'vite.config.ts',
    'vite.config.mjs',
    'rollup.config.js',
    'rollup.config.mjs',
  ]) {
    if (fs.existsSync(path.join(targetDir, name))) {
      flags.push(
        `${name} is unrecognized custom build config — left in place; the contract build is .rspack/rspack.prod.js`
      );
    }
  }
  const hasBabelConfig = fs.existsSync(path.join(targetDir, 'babel.config.js'));
  const babelPackages = [
    ...new Set(
      ['dependencies', 'devDependencies'].flatMap(section =>
        Object.keys(next[section] ?? {}).filter(isBabelPackage)
      )
    ),
  ];
  if (hasBabelConfig || babelPackages.length > 0) {
    // Listed as one @babel/* entry: CLI-era packages have a dozen of them.
    const named = [
      ...(babelPackages.some(name => name.startsWith('@babel/')) ? ['@babel/*'] : []),
      ...babelPackages.filter(name => !name.startsWith('@babel/')),
    ];
    const what = [
      ...(hasBabelConfig ? ['babel.config.js'] : []),
      ...(named.length > 0 ? [`the Babel packages (${named.join(', ')})`] : []),
    ].join(' and ');
    flags.push(
      `${what} ${hasBabelConfig && named.length === 0 ? 'is' : 'are'} no longer used — the .rspack build compiles TS/JSX with builtin:swc-loader; remove ${hasBabelConfig && named.length === 0 ? 'it' : 'them'} when convenient`
    );
  }

  // -- leftovers: other package managers' lockfiles, the CLI build output -----
  // pnpm ignores these lockfiles and writes pnpm-lock.yaml, so leaving them
  // means two lockfiles that disagree. (bun.lock / bun.lockb date from OHIF
  // 3.10–3.12, which kept a bun lockfile alongside yarn.lock.)
  const staleLockfiles = ['yarn.lock', 'package-lock.json', 'bun.lock', 'bun.lockb'].filter(name =>
    fs.existsSync(path.join(targetDir, name))
  );
  if (staleLockfiles.length > 0) {
    note(
      true,
      `remove ${staleLockfiles.join(', ')} (this package now uses pnpm, which writes pnpm-lock.yaml)`
    );
    fileOps.push(() => {
      for (const name of staleLockfiles) {
        fs.rmSync(path.join(targetDir, name), { force: true });
      }
    });
  }
  // The CLI built to dist/umd/<package name>/. Nothing reads it any more (main
  // now points at dist/index.umd.js), and because files includes dist it would
  // ship in a published package. Only that folder is removed; anything else
  // under dist/umd/ is flagged and left in place.
  const umdDir = path.join(targetDir, 'dist', 'umd');
  if (fs.existsSync(umdDir)) {
    const cliOutputDir = path.join(umdDir, ...pkg.name.split('/'));
    const cliOutputRel = path.relative(targetDir, cliOutputDir).split(path.sep).join('/');
    const others = listFiles(umdDir).filter(file => !file.startsWith(cliOutputDir + path.sep));
    if (fs.existsSync(cliOutputDir)) {
      note(
        true,
        `remove ${cliOutputRel}/ (the CLI-era build output; the .rspack build writes dist/index.umd.js)`
      );
      fileOps.push(() => {
        fs.rmSync(cliOutputDir, { recursive: true, force: true });
        // Remove the now-empty scope folder (for @scope/name) and dist/umd/.
        for (let dir = path.dirname(cliOutputDir); dir.startsWith(umdDir); dir = path.dirname(dir)) {
          if (fs.existsSync(dir) && fs.readdirSync(dir).length === 0) {
            fs.rmdirSync(dir);
          }
        }
      });
    }
    if (others.length > 0) {
      flags.push(
        `dist/umd/ holds files other than the CLI build output (${others.length}) — left in place; delete them if they are old build output`
      );
    }
  }

  // -- companion files: .npmrc / AGENTS.md / tailwind.config.js --------------
  const npmrcPath = path.join(targetDir, '.npmrc');
  const npmrcHasLine =
    fs.existsSync(npmrcPath) &&
    fs
      .readFileSync(npmrcPath, 'utf8')
      .split('\n')
      .some(line => line.trim() === 'auto-install-peers=false');
  if (!npmrcHasLine) {
    note(
      true,
      'add .npmrc with auto-install-peers=false (pnpm must not auto-install the host-provided peers)'
    );
    fileOps.push(() => {
      const existing = fs.existsSync(npmrcPath) ? fs.readFileSync(npmrcPath, 'utf8') : '';
      const prefix = existing && !existing.endsWith('\n') ? `${existing}\n` : existing;
      fs.writeFileSync(npmrcPath, `${prefix}auto-install-peers=false\n`);
    });
  } else {
    note(false, '.npmrc already sets auto-install-peers=false');
  }
  // pnpm 12 ignores project settings in .npmrc, so the peer guard must also live
  // in pnpm-workspace.yaml. No file (the usual CLI-era case): write the current
  // template's, which also carries its allowBuilds approvals. A file without the
  // setting: append autoInstallPeers only, leaving the author's other settings
  // alone. Already set: nothing to do.
  const workspacePath = path.join(targetDir, 'pnpm-workspace.yaml');
  if (!fs.existsSync(workspacePath)) {
    note(
      true,
      'add pnpm-workspace.yaml with autoInstallPeers: false + allowBuilds (pnpm 12 reads peer settings only from here)'
    );
    fileOps.push(() =>
      fs.writeFileSync(workspacePath, readTemplateFile(kind, 'pnpm-workspace.yaml'))
    );
  } else if (!/^autoInstallPeers:\s*false\s*$/m.test(fs.readFileSync(workspacePath, 'utf8'))) {
    note(
      true,
      'pnpm-workspace.yaml: add autoInstallPeers: false (pnpm 12 reads peer settings only from here)'
    );
    fileOps.push(() => {
      const existing = fs.readFileSync(workspacePath, 'utf8');
      const prefix = existing && !existing.endsWith('\n') ? `${existing}\n` : existing;
      fs.writeFileSync(workspacePath, `${prefix}autoInstallPeers: false\n`);
    });
  } else {
    note(false, 'pnpm-workspace.yaml already sets autoInstallPeers: false');
  }
  const agentsPath = path.join(targetDir, 'AGENTS.md');
  if (!fs.existsSync(agentsPath)) {
    note(true, 'add AGENTS.md (agent-facing contract summary from the current template)');
    const agents = readTemplateFile(kind, 'AGENTS.md').replaceAll('{{name}}', pkg.name);
    if (agents.includes('{{')) {
      throw new Error('Internal error: unsubstituted template token left in migrated AGENTS.md');
    }
    fileOps.push(() => fs.writeFileSync(agentsPath, agents));
  } else {
    note(false, 'AGENTS.md already present (left untouched)');
  }
  if (kind === 'extension') {
    const tailwindPath = path.join(targetDir, 'tailwind.config.js');
    if (!fs.existsSync(tailwindPath)) {
      note(
        true,
        'add tailwind.config.js (the .rspack CSS pipeline compiles self-contained CSS; preflight off)'
      );
      const tailwind = readTemplateFile(kind, 'tailwind.config.js');
      fileOps.push(() => fs.writeFileSync(tailwindPath, tailwind));
    } else {
      note(false, 'tailwind.config.js already present (left untouched)');
    }
  }

  // -- flag-only source scan --------------------------------------------------
  scanSourceImports(targetDir, flags);

  // -- apply -------------------------------------------------------------------
  const pkgChanged = JSON.stringify(next) !== JSON.stringify(pkg);
  if (!dryRun) {
    if (pkgChanged) {
      fs.writeFileSync(pkgPath, JSON.stringify(next, null, 2) + '\n');
    }
    for (const op of fileOps) {
      op();
    }
  }

  // -- report -------------------------------------------------------------------
  const rewriteCount = changes.filter(line => line.startsWith('[rewrite]')).length;
  const lines = [
    `create-ohif migrate: ${targetDir} (detected: ${kind} "${pkg.name}")`,
    dryRun
      ? 'Mode: dry-run — no files were changed. This report is the migration checklist; re-run without --dry-run to apply the [rewrite] items.'
      : 'Mode: applied.',
    '',
    'Automated rewrites:',
    ...changes.map(line => `  ${line}`),
    '',
    'Manual follow-ups (flag-only, never rewritten automatically):',
    ...(flags.length > 0 ? flags.map(line => `  [flag]    ${line}`) : ['  (none)']),
    '',
    dryRun
      ? `${rewriteCount} rewrite(s) pending, ${flags.length} manual follow-up(s).`
      : `${rewriteCount} rewrite(s) applied, ${flags.length} manual follow-up(s). Next: pnpm install && pnpm build.`,
  ];
  console.log(lines.join('\n'));
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  let parsed;
  try {
    parsed = parseArgs({
      args: process.argv.slice(2),
      allowPositionals: true,
      options: {
        template: { type: 'string', short: 't' },
        scope: { type: 'string' },
        modules: { type: 'string' },
        'in-tree': { type: 'boolean' },
        dir: { type: 'string' },
        yes: { type: 'boolean', short: 'y' },
        'dry-run': { type: 'boolean' },
        help: { type: 'boolean' },
        version: { type: 'boolean' },
      },
    });
  } catch (error) {
    fail(`${error.message}\n\n${USAGE}`);
  }
  const { values, positionals } = parsed;

  if (values.version) {
    console.log(selfPkg.version);
    return;
  }
  if (values.help) {
    console.log(USAGE);
    return;
  }

  // migrate subcommand: handled before the scaffold flow.
  if (positionals[0] === 'migrate') {
    if (positionals.length !== 2) {
      fail(`Usage: create-ohif migrate <path> [--dry-run]`);
    }
    await runMigrate(positionals[1], values['dry-run'] === true);
    return;
  }
  if (values['dry-run']) {
    fail('--dry-run is only valid with the migrate subcommand');
  }

  if (positionals.length > 1) {
    fail(`Unexpected extra arguments: ${positionals.slice(1).join(' ')}\n\n${USAGE}`);
  }
  if (values.scope !== undefined && !SCOPE_RE.test(values.scope)) {
    fail(`Invalid --scope "${values.scope}": must look like @my-scope`);
  }
  if (values.template !== undefined && !TEMPLATES.includes(values.template)) {
    fail(`Unknown template "${values.template}". Allowed: ${TEMPLATES.join(', ')}`);
  }

  // Non-TTY stdin implies --yes semantics (agents/CI use flags).
  const nonInteractive = values.yes === true || !process.stdin.isTTY;

  let name = positionals[0];
  let template = values.template;
  let modules = values.modules !== undefined ? parseModulesCsv(values.modules) : undefined;
  let description;
  let inTree = values['in-tree'] === true;
  let prompts = null;

  if (nonInteractive) {
    if (!name || !template) {
      fail(`Missing required arguments: <name> and --template are required with --yes.\n\n${USAGE}`);
    }
  } else {
    prompts = await loadPrompts();
    prompts.intro(`create-ohif ${selfPkg.version}`);
    const ask = async promise => {
      const answer = await promise;
      if (prompts.isCancel(answer)) {
        prompts.cancel('Cancelled');
        process.exit(1);
      }
      return answer;
    };

    if (!template) {
      template = await ask(
        prompts.select({
          message: 'What are you building?',
          initialValue: 'workspace',
          options: [
            {
              value: 'workspace',
              label: 'Workspace',
              hint: 'your own repo of extensions/modes + config (default for teams)',
            },
            { value: 'extension', label: 'Extension', hint: 'a single OHIF extension package' },
            { value: 'mode', label: 'Mode', hint: 'a single OHIF mode (workflow) package' },
            {
              value: 'deployment',
              label: 'Deployment',
              hint: 'config only: app-config.js + docker-compose',
            },
          ],
        })
      );
    }
    if (!name) {
      name = await ask(
        prompts.text({
          message: 'Package name',
          placeholder: template === 'workspace' ? 'my-ohif-workspace' : `my-ohif-${template}`,
          validate: value => {
            const candidate =
              values.scope && value && !value.startsWith('@') ? `${values.scope}/${value}` : value;
            if (!candidate || !NAME_RE.test(candidate)) {
              return 'Invalid npm package name (lowercase, may be @scope/name)';
            }
          },
        })
      );
    }
    if (template === 'extension' && modules === undefined) {
      modules = await ask(
        prompts.multiselect({
          message: 'Which module types should the extension provide?',
          options: MODULE_KEYS.map(key => ({ value: key, label: key, hint: MODULES[key].hint })),
          initialValues: ['viewport'],
          required: false,
        })
      );
    }
    description = await ask(
      prompts.text({
        message: 'Description',
        placeholder: `OHIF ${template}`,
        defaultValue: `OHIF ${template}`,
      })
    );
    if (
      !inTree &&
      (template === 'extension' || template === 'mode') &&
      values.dir === undefined &&
      findWorkspaceRoot(process.cwd()) === null
    ) {
      const checkoutRoot = findCheckoutRoot(process.cwd());
      if (checkoutRoot) {
        const section = template === 'extension' ? 'extensions' : 'modes';
        inTree = await ask(
          prompts.confirm({
            message: `Scaffold in-tree into ${path.join(checkoutRoot, section)}/?`,
          })
        );
      }
    }
  }

  // Shared validation (flags and prompt answers go through the same gate).
  if (values.scope && !name.startsWith('@')) {
    name = `${values.scope}/${name}`;
  }
  if (!NAME_RE.test(name)) {
    fail(`Invalid package name "${name}" (lowercase npm name, may be @scope/name)`);
  }
  if (modules !== undefined && template !== 'extension') {
    fail(
      template === 'mode'
        ? 'modes have no module selection (--modules is extension-only)'
        : '--modules is only valid with --template extension'
    );
  }
  if (template === 'extension' && modules === undefined) {
    modules = ['viewport'];
  }
  if (inTree && template !== 'extension' && template !== 'mode') {
    fail(`--in-tree only applies to extension and mode templates, not "${template}"`);
  }
  if (description === undefined) {
    description = `OHIF ${template}`;
  }

  const dirName = name.includes('/') ? name.split('/')[1] : name;
  const pluginSection = template === 'extension' ? 'extensions' : 'modes';

  // Resolve the target directory and scaffold context.
  let context = 'standalone';
  let checkoutRoot = null;
  let workspaceRoot = null;
  let targetDir;
  if (inTree) {
    checkoutRoot = findCheckoutRoot(process.cwd());
    if (!checkoutRoot) {
      fail(
        'not inside an OHIF checkout (pnpm-workspace.yaml + platform/app/pluginConfig.json not found in any ancestor)'
      );
    }
    context = 'in-tree';
    targetDir = path.join(checkoutRoot, pluginSection, dirName);
  } else if (
    (template === 'extension' || template === 'mode') &&
    values.dir === undefined &&
    (workspaceRoot = findWorkspaceRoot(process.cwd())) !== null
  ) {
    context = 'workspace';
    targetDir = path.join(workspaceRoot, pluginSection, dirName);
  } else {
    targetDir = path.join(path.resolve(values.dir ?? '.'), dirName);
    // --dir only says where the folder goes. An extension or mode whose folder
    // lands in a workspace's or an OHIF checkout's extensions/ or modes/ is set
    // up for that place, exactly as if it had been scaffolded there without
    // --dir (workspace) or with --in-tree (checkout).
    if (values.dir !== undefined && (template === 'extension' || template === 'mode')) {
      const parentDir = path.dirname(targetDir);
      const isSection = root =>
        root !== null && path.relative(path.join(root, pluginSection), parentDir) === '';
      const dirWorkspace = findWorkspaceRoot(parentDir);
      const dirCheckout = findCheckoutRoot(parentDir);
      if (isSection(dirWorkspace)) {
        context = 'workspace';
        workspaceRoot = dirWorkspace;
      } else if (isSection(dirCheckout)) {
        context = 'in-tree';
        checkoutRoot = dirCheckout;
        console.log(
          `${values.dir} is the ${pluginSection}/ folder of the OHIF checkout at ${dirCheckout}; scaffolding in-tree, as with --in-tree.`
        );
      }
    }
  }

  if (fs.existsSync(targetDir)) {
    fail(`Target directory already exists: ${targetDir}`);
  }

  const templateDir = fileURLToPath(new URL(`../templates/${template}/`, import.meta.url));
  if (!fs.existsSync(templateDir)) {
    fail(`Template "${template}" is not available in this create-ohif build (missing ${templateDir})`);
  }

  // Copy engine.
  fs.mkdirSync(path.dirname(targetDir), { recursive: true });
  fs.cpSync(templateDir, targetDir, { recursive: true });
  renamePass(targetDir);
  substitutePass(targetDir, {
    name,
    dirName,
    ohifVersion: selfPkg.version,
    peerRange: context === 'in-tree' ? 'workspace:*' : hostPeerRange(selfPkg.version),
    // coreVersionRange guidance always uses the peer range shape: a raw caret
    // (^<manifest version>) would exclude the current host, whose injected
    // VERSION_NUMBER (version.txt) lags the manifest version.
    coreRange: hostPeerRange(selfPkg.version),
    // JSON-escaped so free-text answers cannot break package.json.
    description: JSON.stringify(description).slice(1, -1),
  });
  if (template === 'extension') {
    pruneModulesPass(targetDir, modules);
  }
  if (context === 'in-tree') {
    inTreeTransformPass(targetDir, checkoutRoot);
  }
  assertNoTokensPass(targetDir);
  if (context === 'workspace') {
    appendToWorkspaceManifest(workspaceRoot, name, `${pluginSection}/${dirName}`);
  }

  if (prompts) {
    prompts.outro(`Scaffolded ${name}`);
  }
  printSummary({ context, template, name, dirName, targetDir, checkoutRoot });
}

main().catch(error => {
  fail(error && error.stack ? error.stack : String(error));
});
