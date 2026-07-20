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

// WS5.6 authoritative table: multiselect options, --modules validation,
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
      --scope <@scope>   prepended when the positional name is unscoped
      --modules <csv>    extension only; subset of: ${MODULE_KEYS.join(',')}
      --in-tree          scaffold into extensions/|modes/ of the enclosing OHIF checkout
      --dir <path>       parent directory for standalone output (default: cwd)
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

// OHIF checkout detection (WS5.2): a directory containing BOTH markers.
function findCheckoutRoot(from) {
  return findAncestor(
    from,
    dir =>
      fs.existsSync(path.join(dir, 'pnpm-workspace.yaml')) &&
      fs.existsSync(path.join(dir, 'platform', 'app', 'pluginConfig.json'))
  );
}

// B2 workspace detection: a directory containing the committed manifest.
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

// Module pruning pass (extension only, WS5.6): delete unselected module files,
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

// In-tree transform pass (WS5.5): monorepo root .npmrc/pnpm-workspace govern
// installs, and rspack/react/typescript/css tooling resolve from the hoisted
// root node_modules, so the scaffold keeps only the minimal devDeps.
function inTreeTransformPass(targetDir) {
  fs.rmSync(path.join(targetDir, '.npmrc'), { force: true });
  const pkgPath = path.join(targetDir, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  pkg.devDependencies = { 'cross-env': '7.0.3', vitest: '^3.2.0' };
  if (pkg.scripts) {
    delete pkg.scripts.typecheck;
  }
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

// B2: scaffolding an extension/mode inside a workspace appends it to the
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
      'Then register the new workspace package and start the viewer:',
      '  pnpm install --no-frozen-lockfile',
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
    const descriptor = [
      '  {',
      `    "packageName": "${name}",`,
      `    "importPath": "/plugins/${dirName}/index.umd.js",`,
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
      'Or link a local checkout via platform/app/pluginConfig.json (directory mode):',
      `  { "packageName": "${name}", "directory": "~/path/to/${dirName}" }`
    );
  }
  console.log(lines.join('\n'));
}

// ---------------------------------------------------------------------------
// migrate subcommand (B3): port a CLI-era standalone extension/mode to the
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
];
// devDependencies the vendored .rspack config needs at build time (extension
// additionally compiles CSS through postcss/tailwind).
const MIGRATE_DEV_DEPS = {
  extension: {
    '@rspack/cli': '^2.0.0',
    '@rspack/core': '^2.0.0',
    'cross-env': '^7.0.3',
    'css-loader': '^6.11.0',
    postcss: '^8.4.0',
    'postcss-loader': '^8.1.1',
    tailwindcss: '3.2.4',
  },
  mode: {
    '@rspack/cli': '^2.0.0',
    '@rspack/core': '^2.0.0',
    'cross-env': '^7.0.3',
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
    const rel = path.relative(targetDir, file);
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
        `package.json peerDependencies["${name}"]: ${JSON.stringify(peers[name])} -> "${hostRange}" (host peer range; the loader refuses to load on range mismatch)`
      );
      peers[name] = hostRange;
    }
  }
  if (!('@ohif/core' in peers)) {
    note(true, `package.json peerDependencies: add "@ohif/core": "${hostRange}"`);
    peers['@ohif/core'] = hostRange;
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
  next.scripts = scripts;

  // -- package.json: devDependencies -----------------------------------------
  const devDeps = next.devDependencies ?? {};
  const addedDevDeps = [];
  for (const [name, range] of Object.entries(MIGRATE_DEV_DEPS[kind])) {
    if (!(name in devDeps)) {
      devDeps[name] = range;
      addedDevDeps.push(`${name}@${range}`);
    }
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
  if (fs.existsSync(path.join(targetDir, 'babel.config.js'))) {
    flags.push(
      'babel.config.js (and the @babel/* dependencies) are no longer used — the .rspack build compiles TS/JSX with builtin:swc-loader; remove them when convenient'
    );
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

  // migrate subcommand (B3): handled before the scaffold flow.
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
  }

  if (fs.existsSync(targetDir)) {
    fail(`Target directory already exists: ${targetDir}`);
  }

  const templateDir = fileURLToPath(new URL(`../templates/${template}/`, import.meta.url));
  if (!fs.existsSync(templateDir)) {
    fail(`Template "${template}" is not available in this create-ohif build (missing ${templateDir})`);
  }

  // Copy engine (WS5.2 steps 1-6).
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
    inTreeTransformPass(targetDir);
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
