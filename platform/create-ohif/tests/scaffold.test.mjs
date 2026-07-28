// WS5.7: scaffold-behavior tests. Runs the real bin (no network, no install)
// into mkdtemp dirs and asserts the emitted trees for every template:
// extension (module selection per the WS5.6 table), mode, workspace (B2),
// deployment (B2), the in-tree and inside-a-workspace contexts, and the
// refusal cases. The migrate subcommand (B3) is covered by migrate.test.mjs.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const bin = fileURLToPath(new URL('../bin/create-ohif.mjs', import.meta.url));
const selfPkg = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
// Standalone peer range mirrors hostPeerRange() in the bin (B3 range shape).
const [major, minor] = selfPkg.version.split('.');
const hostRange = `>=${major}.${minor}.0-beta.0 <${Number(major) + 1}`;

const GETTER_FILES = {
  viewport: ['src/getViewportModule.tsx', 'src/viewports/ExampleViewport.tsx'],
  panel: ['src/getPanelModule.tsx', 'src/panels/ExamplePanel.tsx'],
  commands: ['src/commandsModule.ts'],
  sopClassHandler: ['src/getSopClassHandlerModule.ts'],
  toolbar: ['src/getToolbarModule.tsx'],
  hangingProtocol: ['src/getHangingProtocolModule.ts'],
};
const ALL_MODULES = Object.keys(GETTER_FILES);
const GETTER_NAMES = {
  viewport: 'getViewportModule',
  panel: 'getPanelModule',
  commands: 'getCommandsModule',
  sopClassHandler: 'getSopClassHandlerModule',
  toolbar: 'getToolbarModule',
  hangingProtocol: 'getHangingProtocolModule',
};

function tmp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'coh-scaffold-'));
}

function run(args, options = {}) {
  return spawnSync(process.execPath, [bin, ...args], { encoding: 'utf8', ...options });
}

function scaffold(args, options = {}) {
  const result = run(args, options);
  assert.equal(result.status, 0, `bin failed:\n${result.stderr}\n${result.stdout}`);
  return result.stdout;
}

function listFiles(root) {
  const out = [];
  const walk = dir => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const entryPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(entryPath);
      } else {
        out.push(entryPath);
      }
    }
  };
  walk(root);
  return out;
}

function assertNoTokens(root) {
  for (const file of listFiles(root)) {
    assert.ok(
      !fs.readFileSync(file, 'utf8').includes('{{'),
      `unsubstituted template token left in ${path.relative(root, file)}`
    );
  }
}

function readPkg(dir) {
  return JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
}

const exists = (dir, rel) => fs.existsSync(path.join(dir, rel));

// ---------------------------------------------------------------------------
// Standalone extension
// ---------------------------------------------------------------------------

test('standalone extension, default module selection (viewport)', () => {
  const parent = tmp();
  scaffold(['my-extension', '--template', 'extension', '--yes', '--dir', parent]);
  const dir = path.join(parent, 'my-extension');

  // Always-emitted tree (WS5.6) + build/config files.
  for (const rel of [
    'package.json',
    'README.md',
    'AGENTS.md',
    'tsconfig.json',
    'tailwind.config.js',
    'public/.gitkeep',
    'src/index.tsx',
    'src/id.ts',
    'src/styles.css',
    'src/__tests__/harness.ts',
    'src/__tests__/extension.test.ts',
  ]) {
    assert.ok(exists(dir, rel), `missing ${rel}`);
  }

  // Underscore-rename applied: dotfiles restored, no underscore leftovers.
  for (const rel of ['.gitignore', '.prettierrc', '.npmrc', '.rspack/rspack.prod.js', '.rspack/pluginExternals.js']) {
    assert.ok(exists(dir, rel), `missing renamed ${rel}`);
  }
  for (const rel of ['_gitignore', '_prettierrc', '_npmrc', '_rspack']) {
    assert.ok(!exists(dir, rel), `underscore artifact ${rel} must not remain`);
  }
  // Double-underscore names are exempt from the rename pass.
  assert.ok(exists(dir, 'src/__tests__'), 'src/__tests__ must survive untouched');

  assert.equal(fs.readFileSync(path.join(dir, '.npmrc'), 'utf8').trim(), 'auto-install-peers=false');
  assertNoTokens(dir);

  // package.json contract: name stamped, working-tree module -> src, publish
  // overrides -> dist, standalone peer range.
  const pkg = readPkg(dir);
  assert.equal(pkg.name, 'my-extension');
  assert.deepEqual(pkg.keywords, ['ohif-extension']);
  assert.equal(pkg.main, 'dist/index.umd.js');
  assert.equal(pkg.module, 'src/index.tsx');
  assert.deepEqual(pkg.files, ['dist', 'src', 'public', 'README.md']);
  assert.deepEqual(pkg.publishConfig, {
    access: 'public',
    main: 'dist/index.umd.js',
    module: 'dist/index.umd.js',
  });
  assert.equal(pkg.peerDependencies['@ohif/core'], hostRange);
  assert.ok(!('exports' in pkg), 'templates deliberately ship no exports map');

  // id contract: src/id.ts derives the id from package.json name.
  const idTs = fs.readFileSync(path.join(dir, 'src/id.ts'), 'utf8');
  assert.ok(idTs.includes("from '../package.json'"), 'id.ts must read package.json');
  const index = fs.readFileSync(path.join(dir, 'src/index.tsx'), 'utf8');
  assert.ok(index.includes("from './id'"), 'index.tsx must import the id');

  // Default selection = viewport only: the other five getters leave neither
  // files nor index.tsx references (WS5.6 verification).
  for (const rel of GETTER_FILES.viewport) {
    assert.ok(exists(dir, rel), `missing selected-module file ${rel}`);
  }
  assert.ok(index.includes('getViewportModule'));
  for (const key of ALL_MODULES.filter(k => k !== 'viewport')) {
    for (const rel of GETTER_FILES[key]) {
      assert.ok(!exists(dir, rel), `unselected-module file ${rel} must be deleted`);
    }
    assert.ok(!index.includes(GETTER_NAMES[key]), `index.tsx must not reference ${GETTER_NAMES[key]}`);
  }
  assert.ok(!exists(dir, 'src/panels'), 'emptied module dirs are pruned');
  assert.ok(!index.includes('<ohif-module:'), 'marker lines must be stripped');
});

test('standalone extension with all six modules keeps every getter', () => {
  const parent = tmp();
  scaffold([
    'full-extension',
    '-t',
    'extension',
    '--modules',
    ALL_MODULES.join(','),
    '--yes',
    '--dir',
    parent,
  ]);
  const dir = path.join(parent, 'full-extension');
  const index = fs.readFileSync(path.join(dir, 'src/index.tsx'), 'utf8');
  for (const key of ALL_MODULES) {
    for (const rel of GETTER_FILES[key]) {
      assert.ok(exists(dir, rel), `missing ${rel}`);
    }
    assert.ok(index.includes(GETTER_NAMES[key]), `index.tsx must wire ${GETTER_NAMES[key]}`);
  }
  assert.ok(!index.includes('<ohif-module:'), 'marker lines must be stripped');
  assertNoTokens(dir);
});

test('standalone extension with an empty module selection scaffolds id + preRegistration only', () => {
  const parent = tmp();
  scaffold(['empty-extension', '-t', 'extension', '--modules', '', '--yes', '--dir', parent]);
  const dir = path.join(parent, 'empty-extension');
  const index = fs.readFileSync(path.join(dir, 'src/index.tsx'), 'utf8');
  for (const key of ALL_MODULES) {
    for (const rel of GETTER_FILES[key]) {
      assert.ok(!exists(dir, rel), `${rel} must be deleted`);
    }
    assert.ok(!index.includes(GETTER_NAMES[key]));
  }
  assert.ok(index.includes('preRegistration'));
  assert.ok(exists(dir, 'src/styles.css'), 'always-emitted files survive an empty selection');
});

test('--scope prepends the scope; the directory uses the unscoped name', () => {
  const parent = tmp();
  const stdout = scaffold(['ext', '--scope', '@acme', '-t', 'extension', '-y', '--dir', parent]);
  const dir = path.join(parent, 'ext');
  assert.ok(fs.existsSync(dir), 'directory is the unscoped name');
  assert.equal(readPkg(dir).name, '@acme/ext');
  // Runtime descriptor guidance uses the scoped name and unscoped dir path.
  assert.ok(stdout.includes('"packageName": "@acme/ext"'), stdout);
  assert.ok(stdout.includes('/plugins/ext/index.umd.js'), stdout);
});

// ---------------------------------------------------------------------------
// Mode template (WS5.4 deltas)
// ---------------------------------------------------------------------------

test('standalone mode scaffold follows the WS5.4 deltas', () => {
  const parent = tmp();
  const stdout = scaffold(['my-mode', '--template', 'mode', '--yes', '--dir', parent]);
  const dir = path.join(parent, 'my-mode');

  for (const rel of [
    'package.json',
    'README.md',
    'AGENTS.md',
    'tsconfig.json',
    '.gitignore',
    '.prettierrc',
    '.npmrc',
    '.rspack/rspack.prod.js',
    '.rspack/pluginExternals.js',
    'src/index.ts',
    'src/id.ts',
    'src/toolbarButtons.ts',
    'src/__tests__/mode.test.ts',
  ]) {
    assert.ok(exists(dir, rel), `missing ${rel}`);
  }
  // No CSS/Tailwind pipeline, no public/, no module selection.
  for (const rel of ['src/styles.css', 'tailwind.config.js', 'public']) {
    assert.ok(!exists(dir, rel), `mode template must not emit ${rel}`);
  }
  assertNoTokens(dir);

  const pkg = readPkg(dir);
  assert.equal(pkg.name, 'my-mode');
  assert.deepEqual(pkg.keywords, ['ohif-mode']);
  assert.equal(pkg.module, 'src/index.ts');
  for (const peer of ['@ohif/core', '@ohif/extension-cornerstone', '@ohif/extension-default']) {
    assert.equal(pkg.peerDependencies[peer], hostRange, peer);
  }
  assert.deepEqual(
    Object.keys(pkg.devDependencies).sort(),
    ['@rspack/cli', '@rspack/core', 'cross-env', 'typescript', 'vitest'],
    'mode devDeps carry no react/css/tailwind toolchain'
  );

  // Build config delta: TS entry, no CSS extraction; UMD contract intact.
  const rspackConfig = fs.readFileSync(path.join(dir, '.rspack/rspack.prod.js'), 'utf8');
  assert.ok(rspackConfig.includes("'../src/index.ts'"));
  assert.ok(!rspackConfig.includes('CssExtractRspackPlugin'));
  assert.ok(rspackConfig.includes("export: 'default'"));

  // Self-contained modeFactory: no i18next anywhere in src/.
  for (const file of listFiles(path.join(dir, 'src'))) {
    assert.ok(!fs.readFileSync(file, 'utf8').includes('i18next'), `${file} must not import i18next`);
  }
  const stampedIndex = fs.readFileSync(path.join(dir, 'src/index.ts'), 'utf8');
  assert.ok(stampedIndex.includes(`'@ohif/extension-default': '^${selfPkg.version}'`));

  // Runtime descriptor guidance: modes have no styles entry.
  assert.ok(stdout.includes('under "modes"'), stdout);
  assert.ok(!stdout.includes('"styles"'), stdout);
});

// ---------------------------------------------------------------------------
// Workspace template (B2)
// ---------------------------------------------------------------------------

test('workspace scaffold emits the committed manifest and the managed-harness layout', () => {
  const parent = tmp();
  scaffold(['my-workspace', '-t', 'workspace', '--yes', '--dir', parent]);
  const dir = path.join(parent, 'my-workspace');

  for (const rel of [
    'package.json',
    'ohif.config.json',
    'config/app-config.js',
    'Dockerfile',
    'scripts/ohif.mjs',
    'extensions/.gitkeep',
    'modes/.gitkeep',
    '.gitignore',
  ]) {
    assert.ok(exists(dir, rel), `missing ${rel}`);
  }
  assertNoTokens(dir);

  const pkg = readPkg(dir);
  assert.equal(pkg.name, 'my-workspace');
  assert.equal(pkg.private, true, 'a workspace is the user repo, never published');
  for (const script of ['dev', 'build', 'doctor', 'plugin']) {
    assert.ok(String(pkg.scripts[script]).includes('scripts/ohif.mjs'), `script ${script}`);
  }

  // The committed manifest: pinned OHIF version, empty plugin list, app config.
  const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'ohif.config.json'), 'utf8'));
  assert.equal(manifest.ohifVersion, selfPkg.version);
  assert.deepEqual(manifest.plugins, []);
  assert.equal(manifest.appConfig, 'config/app-config.js');

  // .ohif/ is machine-managed and must be ignored, never scaffolded.
  assert.ok(fs.readFileSync(path.join(dir, '.gitignore'), 'utf8').includes('.ohif/'));
  assert.ok(!exists(dir, '.ohif'));
});

test('scaffolding inside a workspace lands in extensions|modes and appends to ohif.config.json', () => {
  const parent = tmp();
  scaffold(['team-ws', '-t', 'workspace', '--yes', '--dir', parent]);
  const wsDir = path.join(parent, 'team-ws');

  const extOut = scaffold(['ws-ext', '-t', 'extension', '--yes'], { cwd: wsDir });
  // Workspace detection also walks up from subdirectories.
  const modeOut = scaffold(['ws-mode', '-t', 'mode', '--yes'], {
    cwd: path.join(wsDir, 'modes'),
  });

  const extDir = path.join(wsDir, 'extensions', 'ws-ext');
  const modeDir = path.join(wsDir, 'modes', 'ws-mode');
  assert.ok(fs.existsSync(path.join(extDir, 'package.json')));
  assert.ok(fs.existsSync(path.join(modeDir, 'package.json')));

  // Workspace plugins build standalone (host peers, own .npmrc) — the harness
  // links them via directory entries, not via the monorepo workspace protocol.
  assert.equal(readPkg(extDir).peerDependencies['@ohif/core'], hostRange);
  assert.ok(fs.existsSync(path.join(extDir, '.npmrc')));

  const manifest = JSON.parse(fs.readFileSync(path.join(wsDir, 'ohif.config.json'), 'utf8'));
  assert.deepEqual(manifest.plugins, [
    { packageName: 'ws-ext', directory: './extensions/ws-ext' },
    { packageName: 'ws-mode', directory: './modes/ws-mode' },
  ]);
  assert.ok(extOut.includes('Added to ohif.config.json'), extOut);
  assert.ok(modeOut.includes('Added to ohif.config.json'), modeOut);

  // Re-scaffolding the same name refuses (dir exists) and never duplicates
  // the manifest entry.
  const again = run(['ws-ext', '-t', 'extension', '--yes'], { cwd: wsDir });
  assert.notEqual(again.status, 0);
  const after = JSON.parse(fs.readFileSync(path.join(wsDir, 'ohif.config.json'), 'utf8'));
  assert.equal(after.plugins.filter(p => p.packageName === 'ws-ext').length, 1);
});

// ---------------------------------------------------------------------------
// Deployment template (B2)
// ---------------------------------------------------------------------------

test('deployment scaffold is config-only', () => {
  const parent = tmp();
  const stdout = scaffold(['my-deployment', '-t', 'deployment', '--yes', '--dir', parent]);
  const dir = path.join(parent, 'my-deployment');

  assert.deepEqual(
    listFiles(dir)
      .map(file => path.relative(dir, file))
      .sort(),
    ['README.md', 'app-config.js', 'docker-compose.yml'],
    'deployment emits exactly the three config files (no code, no package.json)'
  );
  assertNoTokens(dir);
  assert.ok(fs.readFileSync(path.join(dir, 'app-config.js'), 'utf8').includes('window.config'));
  const readme = fs.readFileSync(path.join(dir, 'README.md'), 'utf8');
  assert.ok(
    readme.includes(`coreVersionRange: '${hostRange}'`),
    'descriptor coreVersionRange uses the peer range shape the current host accepts'
  );
  assert.ok(
    !readme.includes(`^${selfPkg.version}`),
    'descriptor coreVersionRange must not use a raw caret the lagging host would reject'
  );
  assert.ok(stdout.includes('docker compose up'), stdout);
});

// ---------------------------------------------------------------------------
// In-tree context (WS5.5) against a fake checkout
// ---------------------------------------------------------------------------

function makeFakeCheckout() {
  const root = path.join(tmp(), 'fake-viewers');
  fs.mkdirSync(path.join(root, 'platform', 'app'), { recursive: true });
  fs.mkdirSync(path.join(root, 'extensions'));
  fs.mkdirSync(path.join(root, 'modes'));
  fs.mkdirSync(path.join(root, '.rspack'));
  fs.writeFileSync(path.join(root, 'pnpm-workspace.yaml'), "packages:\n  - 'extensions/*'\n  - 'modes/*'\n");
  fs.writeFileSync(
    path.join(root, 'platform', 'app', 'pluginConfig.json'),
    JSON.stringify({ extensions: [], modes: [], public: [] }, null, 2)
  );
  fs.copyFileSync(
    fileURLToPath(new URL('../../../.rspack/pluginExternals.js', import.meta.url)),
    path.join(root, '.rspack', 'pluginExternals.js')
  );
  return root;
}

test('--in-tree scaffolds into the checkout with workspace peers and minimal devDeps', () => {
  const root = makeFakeCheckout();
  const stdout = scaffold(['tree-ext', '-t', 'extension', '--in-tree', '--yes'], {
    cwd: path.join(root, 'extensions'),
  });
  const dir = path.join(root, 'extensions', 'tree-ext');
  assert.ok(fs.existsSync(dir), 'lands in <checkout>/extensions/');

  const pkg = readPkg(dir);
  assert.equal(pkg.peerDependencies['@ohif/core'], 'workspace:*');
  assert.deepEqual(pkg.devDependencies, { 'cross-env': '7.0.3', vitest: '^3.2.0' });
  assert.equal(pkg.scripts.typecheck, undefined, 'typecheck dropped in-tree (tsc resolves from root)');
  assert.ok(!exists(dir, '.npmrc'), 'root .npmrc governs in-tree installs');
  assertNoTokens(dir);

  // Guidance output: the schema-valid pluginConfig line, never an automatic edit.
  assert.ok(stdout.includes('{ "packageName": "tree-ext" }'), stdout);
  assert.ok(stdout.includes('pluginConfig.json'), stdout);
  assert.deepEqual(
    JSON.parse(fs.readFileSync(path.join(root, 'platform', 'app', 'pluginConfig.json'), 'utf8')),
    { extensions: [], modes: [], public: [] },
    'pluginConfig.json is guidance-only; the bin must not edit it'
  );
});

test('--in-tree mode scaffolds into modes/', () => {
  const root = makeFakeCheckout();
  const stdout = scaffold(['tree-mode', '-t', 'mode', '--in-tree', '--yes'], { cwd: root });
  const dir = path.join(root, 'modes', 'tree-mode');
  assert.ok(fs.existsSync(dir));
  assert.equal(readPkg(dir).peerDependencies['@ohif/extension-default'], 'workspace:*');
  assert.ok(stdout.includes('under "modes"'), stdout);
});

// ---------------------------------------------------------------------------
// Refusal cases (all must exit nonzero without scaffolding)
// ---------------------------------------------------------------------------

test('refusal: existing target directory', () => {
  const parent = tmp();
  fs.mkdirSync(path.join(parent, 'taken'));
  const result = run(['taken', '-t', 'extension', '--yes', '--dir', parent]);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /already exists/);
  assert.ok(!fs.existsSync(path.join(parent, 'taken', 'package.json')));
});

test('refusal: unknown --modules value lists the allowed set', () => {
  const result = run(['x', '-t', 'extension', '--modules', 'bogus', '--yes', '--dir', tmp()]);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Unknown module\(s\): bogus/);
  assert.match(result.stderr, /viewport/);
});

test('refusal: --modules with --template mode', () => {
  const result = run(['x', '-t', 'mode', '--modules', 'viewport', '--yes', '--dir', tmp()]);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /modes have no module selection/);
});

test('refusal: --in-tree outside an OHIF checkout', () => {
  const result = run(['x', '-t', 'extension', '--in-tree', '--yes'], { cwd: tmp() });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /not inside an OHIF checkout/);
});

test('refusal: --in-tree with a non-plugin template', () => {
  const result = run(['x', '-t', 'workspace', '--in-tree', '--yes'], {
    cwd: makeFakeCheckout(),
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /--in-tree only applies to extension and mode/);
});

test('refusal: unknown template and invalid names', () => {
  for (const args of [
    ['x', '-t', 'plugin', '--yes', '--dir', tmp()],
    ['Bad_Name', '-t', 'extension', '--yes', '--dir', tmp()],
    ['x', '-t', 'extension', '--scope', 'acme', '--yes', '--dir', tmp()],
  ]) {
    const result = run(args);
    assert.notEqual(result.status, 0, args.join(' '));
  }
});

test('refusal: --yes without a name or template', () => {
  for (const args of [
    ['--yes', '-t', 'extension', '--dir', tmp()],
    ['x', '--yes', '--dir', tmp()],
  ]) {
    const result = run(args);
    assert.notEqual(result.status, 0, args.join(' '));
    assert.match(result.stderr, /Missing required arguments/);
  }
});

test('refusal: migrate needs a package.json at the target', () => {
  const result = run(['migrate', path.join(tmp(), 'nothing-here')]);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /no package\.json/);
});
