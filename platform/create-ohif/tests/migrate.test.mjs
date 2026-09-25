// B3: `create-ohif migrate` ports a CLI-era standalone extension/mode to the
// current plugin contract. These tests scaffold a package from the captured
// CLI-era template fixture (test/fixtures/cli-era/, snapshotted from
// platform/cli/templates before its deletion) exactly the way the old CLI's
// editPackageJson.js did, then assert the dry-run report (the migration
// checklist) and the applied rewrites.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const bin = fileURLToPath(new URL('../bin/create-ohif.mjs', import.meta.url));
const fixtureRoot = fileURLToPath(new URL('../test/fixtures/cli-era/', import.meta.url));
const templatesRoot = fileURLToPath(new URL('../templates/', import.meta.url));
const selfPkg = JSON.parse(
  fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8')
);
const [major, minor] = selfPkg.version.split('.');
const hostRange = `>=${major}.${minor}.0-beta.0 <${Number(major) + 1}`;

// Reproduce what platform/cli's editPackageJson.js emitted at scaffold time:
// merge the scaffold fields with dependencies.json (LATEST_OHIF_VERSION
// substituted) and delete dependencies.json.
function scaffoldCliEra(kind, name) {
  const target = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'coh-migrate-')), name);
  fs.cpSync(path.join(fixtureRoot, kind), target, { recursive: true });
  const raw = fs
    .readFileSync(path.join(target, 'dependencies.json'), 'utf8')
    .replace(/\{LATEST_OHIF_VERSION\}/g, '3.12.0');
  const pkg = Object.assign(
    {
      name,
      version: '0.0.1',
      description: 'A CLI-era plugin',
      author: 'someone',
      license: 'MIT',
      main: `dist/umd/${name}/index.umd.js`,
      files: ['dist/**', 'public/**', 'README.md'],
    },
    JSON.parse(raw)
  );
  fs.writeFileSync(path.join(target, 'package.json'), JSON.stringify(pkg, null, 2));
  fs.rmSync(path.join(target, 'dependencies.json'));
  return target;
}

function migrate(target, ...args) {
  return execFileSync(process.execPath, [bin, 'migrate', target, ...args], {
    encoding: 'utf8',
  });
}

test('migrate --dry-run report names every mandated rewrite and changes nothing', () => {
  const target = scaffoldCliEra('extension', 'my-cli-extension');
  const report = migrate(target, '--dry-run');

  // The report IS the migration checklist — every B3-mandated rewrite by name.
  for (const needle of [
    'publishConfig: field overrides -> {"access":"public","main":"dist/index.umd.js","module":"dist/index.umd.js"}',
    'files: -> ["dist","src","public","README.md"]',
    'keywords already contains "ohif-extension"',
    `"@ohif/core"]: "^3.12.0" -> "${hostRange}"`,
    `"@ohif/i18n"]: "^1.0.0" -> "${hostRange}"`,
    'drop "webpack"',
    'scripts.dev: -> "cross-env NODE_ENV=development rspack build --config .rspack/rspack.prod.js --watch"',
    'pointed at .webpack/webpack.dev.js',
    'write .rspack/rspack.prod.js + .rspack/pluginExternals.js',
    'remove webpack-5 config .webpack/webpack.prod.js',
    'add .npmrc with auto-install-peers=false',
    'add AGENTS.md',
    'add tailwind.config.js',
  ]) {
    assert.ok(report.includes(needle), `report must mention: ${needle}\n---\n${report}`);
  }
  assert.ok(report.includes('dry-run'), 'report states dry-run mode');

  // Nothing on disk changed.
  assert.ok(fs.existsSync(path.join(target, '.webpack/webpack.prod.js')));
  assert.ok(!fs.existsSync(path.join(target, '.rspack')));
  assert.ok(!fs.existsSync(path.join(target, '.npmrc')));
  assert.ok(!fs.existsSync(path.join(target, 'AGENTS.md')));
  const pkg = JSON.parse(fs.readFileSync(path.join(target, 'package.json'), 'utf8'));
  assert.equal(pkg.main, 'dist/umd/my-cli-extension/index.umd.js');
});

test('migrate applies the extension rewrites and is idempotent', () => {
  const target = scaffoldCliEra('extension', 'my-cli-extension');
  migrate(target);

  const pkg = JSON.parse(fs.readFileSync(path.join(target, 'package.json'), 'utf8'));
  assert.equal(pkg.main, 'dist/index.umd.js');
  assert.equal(pkg.module, 'src/index.tsx');
  assert.deepEqual(pkg.files, ['dist', 'src', 'public', 'README.md']);
  assert.ok(pkg.keywords.includes('ohif-extension'));
  assert.deepEqual(pkg.publishConfig, {
    access: 'public',
    main: 'dist/index.umd.js',
    module: 'dist/index.umd.js',
  });
  for (const name of [
    '@ohif/core',
    '@ohif/extension-default',
    '@ohif/extension-cornerstone',
    '@ohif/i18n',
  ]) {
    assert.equal(pkg.peerDependencies[name], hostRange, name);
  }
  assert.ok(!('@ohif/ui' in pkg.peerDependencies));
  assert.ok(!('webpack' in pkg.peerDependencies));
  assert.ok(!('webpack-merge' in pkg.peerDependencies));
  assert.equal(
    pkg.scripts.dev,
    'cross-env NODE_ENV=development rspack build --config .rspack/rspack.prod.js --watch'
  );
  assert.equal(
    pkg.scripts.build,
    'cross-env NODE_ENV=production rspack build --config .rspack/rspack.prod.js'
  );
  for (const name of ['@rspack/cli', '@rspack/core', 'css-loader', 'postcss-loader', 'tailwindcss']) {
    assert.ok(name in pkg.devDependencies, `devDep ${name}`);
  }
  assert.ok(!('webpack' in pkg.devDependencies));

  // .rspack vendored verbatim from the current template (fixture entry matches).
  assert.equal(
    fs.readFileSync(path.join(target, '.rspack/rspack.prod.js'), 'utf8'),
    fs.readFileSync(path.join(templatesRoot, 'extension/_rspack/rspack.prod.js'), 'utf8')
  );
  assert.equal(
    fs.readFileSync(path.join(target, '.rspack/pluginExternals.js'), 'utf8'),
    fs.readFileSync(path.join(templatesRoot, 'extension/_rspack/pluginExternals.js'), 'utf8')
  );
  assert.ok(!fs.existsSync(path.join(target, '.webpack')));
  assert.equal(fs.readFileSync(path.join(target, '.npmrc'), 'utf8'), 'auto-install-peers=false\n');
  const agents = fs.readFileSync(path.join(target, 'AGENTS.md'), 'utf8');
  assert.ok(agents.includes('my-cli-extension') && !agents.includes('{{'));
  assert.ok(fs.existsSync(path.join(target, 'tailwind.config.js')));

  // Second run: everything already conforms — zero pending rewrites.
  const second = migrate(target, '--dry-run');
  assert.match(second, /\n0 rewrite\(s\) pending/);
});

test('migrate adapts the mode template entry to the CLI-era src/index.tsx', () => {
  const target = scaffoldCliEra('mode', 'my-cli-mode');
  const report = migrate(target);
  assert.ok(report.includes('(detected: mode'), report);
  assert.ok(report.includes('entry adapted to ../src/index.tsx'), report);

  const pkg = JSON.parse(fs.readFileSync(path.join(target, 'package.json'), 'utf8'));
  assert.ok(pkg.keywords.includes('ohif-mode'));
  assert.equal(pkg.peerDependencies['@ohif/core'], hostRange);
  const config = fs.readFileSync(path.join(target, '.rspack/rspack.prod.js'), 'utf8');
  assert.ok(config.includes("'../src/index.tsx'"), 'entry rewritten to the real file');
  assert.ok(!config.includes("'../src/index.ts'\n"), 'template entry replaced');
});

test('migrate flags @ohif/ui imports, internal imports, and custom build config without rewriting them', () => {
  const target = scaffoldCliEra('extension', 'my-cli-extension');
  const custom = path.join(target, 'src', 'custom.tsx');
  fs.writeFileSync(
    custom,
    [
      "import { Button } from '@ohif/ui';",
      "import utils from '@ohif/core/src/utils';",
      "import escape from '../../outside';",
      'export default { Button, utils, escape };',
      '',
    ].join('\n')
  );
  fs.writeFileSync(path.join(target, 'vite.config.js'), 'export default {};\n');
  fs.writeFileSync(path.join(target, '.webpack', 'custom-plugin.js'), 'module.exports = {};\n');

  const report = migrate(target, '--dry-run');
  assert.ok(report.includes('src/custom.tsx:1 imports "@ohif/ui"'), report);
  assert.ok(report.includes('OHIF internals outside the contract ("@ohif/core/src/utils")'), report);
  assert.ok(report.includes('resolves outside the package root'), report);
  assert.ok(report.includes('vite.config.js is unrecognized custom build config'), report);
  assert.ok(report.includes('.webpack/custom-plugin.js is unrecognized custom build config'), report);

  // Flag-only: even a real run must leave all of them untouched.
  migrate(target);
  assert.equal(fs.readFileSync(custom, 'utf8').split('\n')[0], "import { Button } from '@ohif/ui';");
  assert.ok(fs.existsSync(path.join(target, 'vite.config.js')));
  assert.ok(fs.existsSync(path.join(target, '.webpack', 'custom-plugin.js')));
  assert.ok(!fs.existsSync(path.join(target, '.webpack', 'webpack.prod.js')), 'recognized config still replaced');
});
