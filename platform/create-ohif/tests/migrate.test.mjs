// `create-ohif migrate` ports a CLI-era standalone extension/mode to the
// current plugin contract. These tests scaffold a package from the captured
// CLI-era template fixture (test/fixtures/cli-era/, snapshotted from
// platform/cli/templates before its deletion) exactly the way the old CLI's
// editPackageJson.js did, then assert the dry-run report (the migration
// checklist) and the applied rewrites.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const bin = fileURLToPath(new URL('../bin/create-ohif.mjs', import.meta.url));
const fixtureRoot = fileURLToPath(new URL('../test/fixtures/cli-era/', import.meta.url));
const templatesRoot = fileURLToPath(new URL('../templates/', import.meta.url));
// The bin runs from this checkout, so it targets the checkout's version.
const checkoutPkg = JSON.parse(
  fs.readFileSync(new URL('../../../package.json', import.meta.url), 'utf8')
);
const [major, minor] = checkoutPkg.version.split('.');
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

  // The report IS the migration checklist — every required rewrite by name.
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
    'add pnpm-workspace.yaml with autoInstallPeers: false',
    'peerDependencies["react"]: "^18.3.1" -> "^19.0.0"',
    'peerDependencies["react-dom"]: "^18.3.1" -> "^19.0.0"',
    "Note: the versions of react, react-dom will be set to the host's.",
    'pin to exact versions (cross-env ^7.0.3 -> 7.0.3)',
    "devDependencies: dotenv isn't used by any script, config or source file — remove it",
    'add AGENTS.md',
    'add tailwind.config.js',
  ]) {
    assert.ok(report.includes(needle), `report must mention: ${needle}\n---\n${report}`);
  }
  // React Router and react-i18next peers are already on the host's majors.
  assert.ok(!report.includes('peerDependencies["react-router'), report);
  assert.ok(!report.includes('peerDependencies["react-i18next"]'), report);
  assert.ok(report.includes('dry-run'), 'report states dry-run mode');

  // Nothing on disk changed.
  assert.ok(fs.existsSync(path.join(target, '.webpack/webpack.prod.js')));
  assert.ok(!fs.existsSync(path.join(target, '.rspack')));
  assert.ok(!fs.existsSync(path.join(target, '.npmrc')));
  assert.ok(!fs.existsSync(path.join(target, 'AGENTS.md')));
  const pkg = JSON.parse(fs.readFileSync(path.join(target, 'package.json'), 'utf8'));
  assert.equal(pkg.main, 'dist/umd/my-cli-extension/index.umd.js');
});

test('migrate moves react from dependencies to peerDependencies', () => {
  const target = scaffoldCliEra('extension', 'react-dep-extension');
  const pkgPath = path.join(target, 'package.json');
  const scaffolded = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  delete scaffolded.peerDependencies.react;
  scaffolded.dependencies = { ...scaffolded.dependencies, react: '^17.0.2' };
  fs.writeFileSync(pkgPath, JSON.stringify(scaffolded, null, 2));

  const report = migrate(target, '--dry-run');
  assert.ok(
    report.includes('dependencies: move "react" "^17.0.2" to peerDependencies "^19.0.0"'),
    report
  );
  assert.ok(!report.includes('react@^17.0.2'), 'react is moved, not flagged for pinning');

  migrate(target);
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  assert.ok(!('react' in pkg.dependencies));
  assert.equal(pkg.peerDependencies.react, '^19.0.0');

  assert.ok(!migrate(target, '--dry-run').includes('move "react"'), 'second run moves nothing');
});

test("migrate aligns React Router and i18next peers to the host app's majors", () => {
  const appDeps = JSON.parse(
    fs.readFileSync(new URL('../../app/package.json', import.meta.url), 'utf8')
  ).dependencies;
  const target = scaffoldCliEra('extension', 'shared-peers-extension');
  const pkgPath = path.join(target, 'package.json');
  const scaffolded = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  Object.assign(scaffolded.peerDependencies, {
    'react-router': '^5.3.0',
    'react-router-dom': '^5.3.0',
    i18next: '^21.0.0',
    'react-i18next': '^11.0.0',
  });
  fs.writeFileSync(pkgPath, JSON.stringify(scaffolded, null, 2));

  const report = migrate(target);
  assert.ok(report.includes('peerDependencies["react-router-dom"]: "^5.3.0" -> "^'), report);
  assert.ok(report.includes('Note: the versions of'), report);
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  // Each peer is a caret range on the major the host app bundles, so the
  // host's own copy satisfies it.
  for (const name of ['react-router', 'react-router-dom', 'i18next', 'react-i18next']) {
    const [peerMajor] = pkg.peerDependencies[name].replace(/^\^/, '').split('.');
    const [appMajor] = appDeps[name].split('.');
    assert.equal(`${name}@${peerMajor}`, `${name}@${appMajor}`);
  }

  assert.ok(
    !migrate(target, '--dry-run').includes('Note: the versions'),
    'second run rewrites nothing'
  );
});

test('migrate moves React Router and i18next from dependencies to peerDependencies', () => {
  const target = scaffoldCliEra('extension', 'shared-dep-extension');
  const pkgPath = path.join(target, 'package.json');
  const scaffolded = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  delete scaffolded.peerDependencies['react-router-dom'];
  scaffolded.dependencies = {
    ...scaffolded.dependencies,
    'react-router-dom': '^6.4.0',
    i18next: '^19.9.2',
  };
  fs.writeFileSync(pkgPath, JSON.stringify(scaffolded, null, 2));

  const report = migrate(target, '--dry-run');
  for (const needle of [
    'dependencies: move "react-router-dom" "^6.4.0" to peerDependencies "^6.4.0"',
    'dependencies: move "i18next" "^19.9.2" to peerDependencies "^19.9.2"',
  ]) {
    assert.ok(report.includes(needle), `report must mention: ${needle}\n---\n${report}`);
  }
  // Both were already on the host's majors, so the note names only React (the
  // CLI-era template's React 18 peers).
  assert.ok(report.includes("Note: the versions of react, react-dom will be set to the host's."), report);

  migrate(target);
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  assert.ok(!('react-router-dom' in pkg.dependencies));
  assert.ok(!('i18next' in pkg.dependencies));
  assert.equal(pkg.peerDependencies['react-router-dom'], '^6.4.0');
  assert.equal(pkg.peerDependencies.i18next, '^19.9.2');
});

test("migrate keeps a shared package's version on the host's major as a peer", () => {
  const target = scaffoldCliEra('extension', 'same-major-extension');
  editPackage(target, pkg => {
    for (const name of ['react', 'react-dom', 'react-router-dom']) {
      delete pkg.peerDependencies[name];
    }
    pkg.peerDependencies['react-router'] = '6.30.0';
    pkg.dependencies = {
      ...pkg.dependencies,
      react: '19.2.0',
      'react-dom': '^19.1.0',
      'react-router-dom': '^5.3.0',
      'react-i18next': '^12.1.0',
    };
  });

  const report = migrate(target, '--dry-run');
  for (const needle of [
    // An exact version becomes a caret range of itself; a range is kept.
    'dependencies: move "react" "19.2.0" to peerDependencies "^19.2.0"',
    'dependencies: move "react-dom" "^19.1.0" to peerDependencies "^19.1.0"',
    // Another major takes the host's.
    'dependencies: move "react-router-dom" "^5.3.0" to peerDependencies "^6.0.0"',
    // An existing peer wins over the dependency.
    `dependencies: drop "react-i18next" "^12.1.0" (it's already a peer, "^12.2.2"`,
    'peerDependencies["react-router"]: "6.30.0" -> "^6.30.0" (an exact peer is met by that one release only',
    // Only react-router-dom changed major.
    "Note: the versions of react-router-dom will be set to the host's.",
  ]) {
    assert.ok(report.includes(needle), `report must mention: ${needle}\n---\n${report}`);
  }

  migrate(target);
  const pkg = JSON.parse(fs.readFileSync(path.join(target, 'package.json'), 'utf8'));
  assert.deepEqual(
    {
      react: pkg.peerDependencies.react,
      'react-dom': pkg.peerDependencies['react-dom'],
      'react-router': pkg.peerDependencies['react-router'],
      'react-router-dom': pkg.peerDependencies['react-router-dom'],
      'react-i18next': pkg.peerDependencies['react-i18next'],
    },
    {
      react: '^19.2.0',
      'react-dom': '^19.1.0',
      'react-router': '^6.30.0',
      'react-router-dom': '^6.0.0',
      'react-i18next': '^12.2.2',
    }
  );
  for (const name of ['react', 'react-dom', 'react-router-dom', 'react-i18next']) {
    assert.ok(!(name in pkg.dependencies), name);
  }
  const again = migrate(target, '--dry-run');
  assert.ok(!/peerDependencies\["react|move "react|drop "react/.test(again), again);
});

test('migrate prints no version note when no shared peer changes', () => {
  // The CLI-era mode template peer-depends on @ohif/core only.
  const target = scaffoldCliEra('mode', 'no-shared-peers-mode');
  assert.ok(!migrate(target, '--dry-run').includes('Note: the versions'));
});

test('migrate raises engines.node to the template and drops the npm and yarn engines', () => {
  const target = scaffoldCliEra('mode', 'old-engines-mode');
  const pkgPath = path.join(target, 'package.json');
  const scaffolded = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  // Some old CLI templates' engines.
  scaffolded.engines = { node: '>=14', npm: '>=6', yarn: '>=1.16.0' };
  fs.writeFileSync(pkgPath, JSON.stringify(scaffolded, null, 2));
  const templateNode = JSON.parse(
    fs.readFileSync(path.join(templatesRoot, 'mode', 'package.json'), 'utf8')
  ).engines.node;

  const report = migrate(target, '--dry-run');
  for (const needle of [
    `engines.node: ">=14" -> "${templateNode}"`,
    'engines.npm: drop ">=6"',
    'engines.yarn: drop ">=1.16.0"',
  ]) {
    assert.ok(report.includes(needle), `report missing: ${needle}\n${report}`);
  }

  migrate(target);
  assert.deepEqual(JSON.parse(fs.readFileSync(pkgPath, 'utf8')).engines, { node: templateNode });
  assert.ok(!migrate(target, '--dry-run').includes('engines.node: "'), 'second run changes nothing');
});

test('migrate keeps a higher engines.node floor and other engines', () => {
  const target = scaffoldCliEra('extension', 'strict-engines-extension');
  const pkgPath = path.join(target, 'package.json');
  const scaffolded = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  scaffolded.engines = { node: '>=99.1', pnpm: '>=12' };
  fs.writeFileSync(pkgPath, JSON.stringify(scaffolded, null, 2));

  assert.ok(migrate(target, '--dry-run').includes('engines.node: keep ">=99.1"'));
  migrate(target);
  assert.deepEqual(JSON.parse(fs.readFileSync(pkgPath, 'utf8')).engines, {
    node: '>=99.1',
    pnpm: '>=12',
  });
});

test("migrate drops the CLI template's OHIF/Viewers repository", () => {
  const target = scaffoldCliEra('extension', 'ohif-repo-extension');
  const pkgPath = path.join(target, 'package.json');
  assert.equal(JSON.parse(fs.readFileSync(pkgPath, 'utf8')).repository, 'OHIF/Viewers');

  assert.ok(migrate(target, '--dry-run').includes('package.json repository: drop "OHIF/Viewers"'));
  migrate(target);
  assert.ok(!('repository' in JSON.parse(fs.readFileSync(pkgPath, 'utf8'))));
  assert.ok(!migrate(target, '--dry-run').includes('repository'), 'second run reports nothing');
});

test("migrate keeps the author's own repository", () => {
  for (const repository of [
    'acme/ohif-extension-foo',
    { type: 'git', url: 'https://github.com/OHIF/Viewers.git', directory: 'extensions/foo' },
  ]) {
    const target = scaffoldCliEra('extension', 'own-repo-extension');
    const pkgPath = path.join(target, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    pkg.repository = repository;
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));

    assert.ok(!migrate(target, '--dry-run').includes('repository'));
    migrate(target);
    assert.deepEqual(JSON.parse(fs.readFileSync(pkgPath, 'utf8')).repository, repository);
  }
});

// Write extra devDependencies (and optionally files) into a CLI-era scaffold.
function withDevDeps(target, devDependencies, extraPkg = {}) {
  const pkgPath = path.join(target, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  Object.assign(pkg.devDependencies, devDependencies);
  Object.assign(pkg, extraPkg, { scripts: { ...pkg.scripts, ...extraPkg.scripts } });
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
}

test('migrate says to remove dead devDependencies instead of pinning them', () => {
  const target = scaffoldCliEra('extension', 'dead-dev-deps-extension');
  // The extra devDependencies older CLI-era packages carry.
  withDevDeps(target, {
    'babel-eslint': '9.x',
    'babel-plugin-inline-react-svg': '^2.0.2',
    'babel-plugin-module-resolver': '^5.0.0',
    eslint: '^5.0.1',
    'eslint-loader': '^2.0.0',
  });
  fs.writeFileSync(path.join(target, 'babel.config.js'), 'module.exports = {};\n');

  const report = migrate(target, '--dry-run');
  for (const needle of [
    'eslint-loader) — superseded by .rspack/',
    "devDependencies: eslint, babel-eslint, dotenv aren't used by any script, config or source file — remove them",
    'babel.config.js and the Babel packages (@babel/*, babel-plugin-inline-react-svg, babel-plugin-module-resolver) are no longer used',
  ]) {
    assert.ok(report.includes(needle), `report missing: ${needle}\n${report}`);
  }
  const pinLine = report.split('\n').find(line => line.includes('not pinned to exact versions')) ?? '';
  for (const name of ['babel-', 'eslint', 'dotenv', '@babel/']) {
    assert.ok(!pinLine.includes(name), `${name} must not be in the pin flag: ${pinLine}`);
  }

  migrate(target);
  const pkg = JSON.parse(fs.readFileSync(path.join(target, 'package.json'), 'utf8'));
  assert.ok(!('eslint-loader' in pkg.devDependencies), 'eslint-loader is removed');
  assert.equal(pkg.devDependencies.eslint, '^5.0.1', 'eslint is flagged, not removed');
});

test('migrate still asks to pin eslint and dotenv when the package uses them', () => {
  const target = scaffoldCliEra('extension', 'used-tools-extension');
  withDevDeps(target, { eslint: '^8.0.0' }, { scripts: { lint: 'eslint src' } });
  fs.writeFileSync(path.join(target, '.eslintrc.json'), '{}\n');
  fs.mkdirSync(path.join(target, 'src', 'config'), { recursive: true });
  fs.writeFileSync(path.join(target, 'src', 'config', 'env.ts'), "import 'dotenv/config';\n");

  const report = migrate(target, '--dry-run');
  assert.ok(!report.includes("used by any script, config or source file"), report);
  assert.ok(
    report.includes('devDependencies not pinned to exact versions: ') &&
      report.includes('dotenv@^14.1.0') &&
      report.includes('eslint@^8.0.0'),
    report
  );
});

test('migrate drops the CLI dev alias, rewrites yarn scripts and flags jest', () => {
  const target = scaffoldCliEra('mode', 'scripts-mode');
  const pkgPath = path.join(target, 'package.json');
  const scaffolded = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  scaffolded.scripts.start = 'yarn run dev';
  scaffolded.scripts.serve = 'yarn dev';
  scaffolded.scripts.setup = 'yarn install';
  scaffolded.scripts.release = 'pnpm run build && yarn publish';
  fs.writeFileSync(pkgPath, JSON.stringify(scaffolded, null, 2));

  const report = migrate(target, '--dry-run');
  for (const needle of [
    `scripts["dev:cornerstone"]: drop (the CLI template's alias for dev`,
    'scripts["start"]: "yarn run dev" -> "pnpm run dev"',
    'scripts["serve"]: "yarn dev" -> "pnpm run dev"',
    'scripts["setup"] still calls yarn ("yarn install")',
    'scripts["release"] still calls yarn ("pnpm run build && yarn publish")',
    `scripts["test:unit"] runs jest, which isn't a dependency`,
    `scripts["test:unit:ci"] runs jest, which isn't a dependency`,
  ]) {
    assert.ok(report.includes(needle), `report must mention: ${needle}\n---\n${report}`);
  }
  assert.ok(!report.includes('scripts["setup"]: "yarn install" ->'), 'yarn commands are flagged, not rewritten');

  migrate(target);
  const { scripts } = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  assert.ok(!('dev:cornerstone' in scripts));
  assert.equal(scripts.start, 'pnpm run dev');
  assert.equal(scripts.serve, 'pnpm run dev');
  assert.equal(scripts.setup, 'yarn install');
  assert.equal(scripts.release, 'pnpm run build && yarn publish');
  assert.equal(scripts['test:unit'], 'jest --watchAll', 'jest scripts are flagged, not changed');

  const again = migrate(target, '--dry-run');
  assert.ok(
    !again.includes(': drop (') && !again.includes('"yarn run') && !again.includes('"yarn dev" ->'),
    again
  );
});

test('migrate removes other lockfiles and the CLI build output', () => {
  const target = scaffoldCliEra('extension', 'leftovers-extension');
  const write = (rel, text = 'x') => {
    fs.mkdirSync(path.dirname(path.join(target, rel)), { recursive: true });
    fs.writeFileSync(path.join(target, rel), text);
  };
  write('yarn.lock');
  write('package-lock.json', '{}');
  write('bun.lock', '{}');
  write('bun.lockb');
  write('dist/umd/leftovers-extension/index.umd.js');
  write('dist/keep.txt');

  const report = migrate(target, '--dry-run');
  for (const needle of [
    'remove yarn.lock, package-lock.json, bun.lock, bun.lockb (this package now uses pnpm',
    'remove dist/umd/leftovers-extension/ (the CLI-era build output',
  ]) {
    assert.ok(report.includes(needle), `report must mention: ${needle}\n---\n${report}`);
  }
  assert.ok(fs.existsSync(path.join(target, 'yarn.lock')), 'dry run deletes nothing');
  assert.ok(fs.existsSync(path.join(target, 'dist/umd/leftovers-extension/index.umd.js')));

  migrate(target);
  assert.ok(!fs.existsSync(path.join(target, 'yarn.lock')));
  assert.ok(!fs.existsSync(path.join(target, 'package-lock.json')));
  assert.ok(!fs.existsSync(path.join(target, 'bun.lock')));
  assert.ok(!fs.existsSync(path.join(target, 'bun.lockb')));
  assert.ok(!fs.existsSync(path.join(target, 'dist/umd')), 'the emptied dist/umd/ is removed too');
  assert.ok(fs.existsSync(path.join(target, 'dist/keep.txt')), 'the rest of dist/ is untouched');
  assert.ok(
    report.includes('dist/ holds 1 file(s) besides the .rspack build output (dist/keep.txt)'),
    `the leftover is flagged\n${report}`
  );
});

test('migrate removes dist/ once the CLI build output was the only thing in it', () => {
  const target = scaffoldCliEra('extension', 'empty-dist-extension');
  const bundle = path.join(target, 'dist/umd/empty-dist-extension/index.umd.js');
  fs.mkdirSync(path.dirname(bundle), { recursive: true });
  fs.writeFileSync(bundle, 'x');

  migrate(target);
  assert.ok(!fs.existsSync(path.join(target, 'dist')), 'the emptied dist/ is removed');

  // A dist/ that is already empty (nothing of the CLI's left) goes too.
  fs.mkdirSync(path.join(target, 'dist'));
  assert.ok(migrate(target, '--dry-run').includes('remove the empty dist/'));
  migrate(target);
  assert.ok(!fs.existsSync(path.join(target, 'dist')));

  // After pnpm build, dist/ holds the .rspack output: a re-run says nothing about it.
  fs.mkdirSync(path.join(target, 'dist'));
  fs.writeFileSync(path.join(target, 'dist/index.umd.js'), 'x');
  fs.writeFileSync(path.join(target, 'dist/index.umd.js.map'), 'x');
  const again = migrate(target, '--dry-run');
  assert.ok(
    !again.includes('remove the empty dist/') && !again.includes('dist/ holds'),
    `a built dist/ is left alone and not flagged\n${again}`
  );
  migrate(target);
  assert.ok(fs.existsSync(path.join(target, 'dist/index.umd.js')));
});

test('migrate removes a scoped CLI build output and flags other dist/umd files', () => {
  const target = scaffoldCliEra('extension', 'scoped-extension');
  const pkgPath = path.join(target, 'package.json');
  const scaffolded = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  scaffolded.name = '@acme/scoped-extension';
  fs.writeFileSync(pkgPath, JSON.stringify(scaffolded, null, 2));
  for (const rel of ['dist/umd/@acme/scoped-extension/index.umd.js', 'dist/umd/something-else.js']) {
    fs.mkdirSync(path.dirname(path.join(target, rel)), { recursive: true });
    fs.writeFileSync(path.join(target, rel), 'x');
  }

  const report = migrate(target, '--dry-run');
  assert.ok(report.includes('remove dist/umd/@acme/scoped-extension/ (the CLI-era build output'), report);
  assert.ok(
    report.includes(
      'dist/ holds 1 file(s) besides the .rspack build output (dist/umd/something-else.js)'
    ),
    report
  );

  migrate(target);
  assert.ok(!fs.existsSync(path.join(target, 'dist/umd/@acme')), 'the emptied scope folder is removed');
  assert.ok(fs.existsSync(path.join(target, 'dist/umd/something-else.js')), 'unrecognised files stay');
});

test('migrate keeps a dev alias the author changed', () => {
  const target = scaffoldCliEra('extension', 'alias-extension');
  const pkgPath = path.join(target, 'package.json');
  const scaffolded = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  scaffolded.scripts['dev:my-extension'] = 'node tools/watch.js';
  fs.writeFileSync(pkgPath, JSON.stringify(scaffolded, null, 2));

  migrate(target);
  const { scripts } = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  assert.equal(scripts['dev:my-extension'], 'node tools/watch.js');
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
  // React peers follow the host's major; ranged toolchain entries become exact
  // pins; ranges migrate has no pin for are flagged, not rewritten.
  assert.equal(pkg.peerDependencies.react, '^19.0.0');
  assert.equal(pkg.peerDependencies['react-dom'], '^19.0.0');
  assert.equal(pkg.devDependencies['cross-env'], '7.0.3');
  assert.equal(pkg.devDependencies.dotenv, '^14.1.0');
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
  assert.equal(
    fs.readFileSync(path.join(target, 'pnpm-workspace.yaml'), 'utf8'),
    fs.readFileSync(path.join(templatesRoot, 'extension/pnpm-workspace.yaml'), 'utf8')
  );
  const agents = fs.readFileSync(path.join(target, 'AGENTS.md'), 'utf8');
  assert.ok(agents.includes('my-cli-extension') && !agents.includes('{{'));
  assert.ok(fs.existsSync(path.join(target, 'tailwind.config.js')));

  // Second run: everything already conforms — zero pending rewrites.
  const second = migrate(target, '--dry-run');
  assert.match(second, /\n0 rewrite\(s\) pending/);
});

test('migrate appends autoInstallPeers to an existing pnpm-workspace.yaml and keeps its settings', () => {
  const target = scaffoldCliEra('extension', 'my-pnpm-extension');
  const workspacePath = path.join(target, 'pnpm-workspace.yaml');
  // An author's own workspace file, deliberately without a trailing newline.
  const authored = '# authored by the plugin team\nminimumReleaseAge: 1440';
  fs.writeFileSync(workspacePath, authored);

  const report = migrate(target, '--dry-run');
  assert.ok(
    report.includes('pnpm-workspace.yaml: add autoInstallPeers: false'),
    `dry-run report must name the append\n---\n${report}`
  );
  assert.equal(fs.readFileSync(workspacePath, 'utf8'), authored, 'dry-run changes nothing');

  migrate(target);
  assert.equal(
    fs.readFileSync(workspacePath, 'utf8'),
    `${authored}\nautoInstallPeers: false\n`,
    "the author's content is kept and only the setting is appended"
  );

  const second = migrate(target, '--dry-run');
  assert.ok(second.includes('pnpm-workspace.yaml already sets autoInstallPeers: false'), second);
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
      "import { cn } from '@ohif/ui-next/lib/utils';",
      'export default { Button, utils, escape, cn };',
      '',
    ].join('\n')
  );
  fs.writeFileSync(path.join(target, 'vite.config.js'), 'export default {};\n');
  fs.writeFileSync(path.join(target, '.webpack', 'custom-plugin.js'), 'module.exports = {};\n');

  const report = migrate(target, '--dry-run');
  assert.ok(report.includes('src/custom.tsx:1 imports "@ohif/ui"'), report);
  assert.ok(report.includes('OHIF internals outside the contract ("@ohif/core/src/utils")'), report);
  assert.ok(report.includes('resolves outside the package root'), report);
  // A ui-next subpath export resolves compiled in, so it isn't an internal, but
  // a runtime bundle can't use it.
  assert.ok(
    report.includes(
      'imports "@ohif/ui-next/lib/utils", a @ohif/ui-next subpath — works only compiled into'
    ),
    report
  );
  assert.ok(!report.includes('outside the contract ("@ohif/ui-next/lib/utils")'), report);
  assert.ok(report.includes('vite.config.js is unrecognized custom build config'), report);
  assert.ok(report.includes('.webpack/custom-plugin.js is unrecognized custom build config'), report);

  // Flag-only: even a real run must leave all of them untouched.
  migrate(target);
  assert.equal(fs.readFileSync(custom, 'utf8').split('\n')[0], "import { Button } from '@ohif/ui';");
  assert.ok(fs.existsSync(path.join(target, 'vite.config.js')));
  assert.ok(fs.existsSync(path.join(target, '.webpack', 'custom-plugin.js')));
  assert.ok(!fs.existsSync(path.join(target, '.webpack', 'webpack.prod.js')), 'recognized config still replaced');
});

test("migrate gives the CLI template's reasons only for a config that matches it", () => {
  const target = scaffoldCliEra('extension', 'my-cli-extension');
  const devReason = 'the contract build in watch mode, so dev writes the same dist/index.umd.js the viewer loads';
  const removeReason =
    "replaced by .rspack/, the plugin contract's build: dist/index.umd.js, window[name] set to the extension, and the host's externals";
  let report = migrate(target, '--dry-run');
  assert.ok(report.includes(`${devReason}; the CLI-era script pointed at`), report);
  assert.ok(report.includes('a file the CLI template never shipped'), report);
  assert.ok(report.includes(`${removeReason}; the old config's output.library was declared twice`), report);

  // A plugin from the OHIF repo has a webpack.dev.js and declares library once.
  fs.writeFileSync(path.join(target, '.webpack', 'webpack.dev.js'), 'module.exports = {};\n');
  fs.writeFileSync(
    path.join(target, '.webpack', 'webpack.prod.js'),
    "module.exports = { output: { library: { type: 'umd' } } };\n"
  );
  report = migrate(target, '--dry-run');
  assert.ok(report.includes(`(${devReason})`), report);
  assert.ok(!report.includes('never shipped'), report);
  assert.ok(report.includes('.webpack/webpack.dev.js'), report);
  assert.ok(report.includes(`(${removeReason})`), report);
  assert.ok(!report.includes('declared twice'), report);
});

test("migrate flags imports of the OHIF app's aliases and @ohif/app", () => {
  // The app's aliases, read from the repo's resolveConfig.js so a new alias
  // there fails this test until migrate knows it: everything in `alias` except
  // the dedupe aliases and the exact-match '@ohif/app$'.
  const require = createRequire(import.meta.url);
  const { alias, dedupeAlias } = require('../../../.rspack/resolveConfig.js');
  const appAliases = Object.keys(alias).filter(
    name => !(name in dedupeAlias) && !name.endsWith('$')
  );
  assert.ok(appAliases.length > 0, 'resolveConfig.js still has the app aliases');
  // migrate's own list must match exactly, so it can't keep an alias that
  // resolveConfig.js has dropped either. The bin runs on load, so read its source.
  const [, listSource = ''] =
    fs.readFileSync(bin, 'utf8').match(/const APP_ALIASES = \[([^\]]*)\];/) ?? [];
  const migrateAliases = [...listSource.matchAll(/'([^']+)'/g)].map(m => m[1]);
  assert.deepEqual([...migrateAliases].sort(), [...appAliases].sort());

  const target = scaffoldCliEra('extension', 'app-alias-extension');
  fs.writeFileSync(
    path.join(target, 'src', 'app-imports.tsx'),
    [
      ...appAliases.map((name, i) => `import a${i} from '${name}/x';`),
      "import { preserveQueryParameters } from '@ohif/app';",
      "import { utils } from '@ohif/core';",
      '',
    ].join('\n')
  );

  const report = migrate(target, '--dry-run');
  for (const name of appAliases) {
    assert.ok(
      report.includes(`imports "${name}/x", an alias inside the OHIF app`),
      `${name}\n---\n${report}`
    );
  }
  assert.ok(report.includes('imports "@ohif/app" — works only compiled into an OHIF checkout'), report);
  assert.ok(!report.includes('"@ohif/core", an alias'), 'a bare @ohif package is not an app alias');
});

test('migrate drops an @ohif/app peer and flags peers on unpublished OHIF packages', () => {
  const target = scaffoldCliEra('extension', 'unpublished-peers-extension');
  const pkgPath = path.join(target, 'package.json');
  const scaffolded = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  Object.assign(scaffolded.peerDependencies, {
    '@ohif/app': '3.12.0',
    '@ohif/extension-cornerstone-dicom-sr': '^3.12.0',
    '@ohif/extension-measurement-tracking': '^3.12.0',
  });
  fs.writeFileSync(pkgPath, JSON.stringify(scaffolded, null, 2));

  const report = migrate(target, '--dry-run');
  assert.ok(report.includes('peerDependencies: drop "@ohif/app" (never a peer'), report);
  const flag = report.split('\n').find(line => line.includes('no longer published to npm')) ?? '';
  assert.ok(
    flag.includes('@ohif/extension-cornerstone-dicom-sr, @ohif/extension-measurement-tracking are'),
    report
  );
  // The CLI-era fixture's other @ohif peers are all published.
  assert.ok(!flag.includes('@ohif/extension-default'), flag);

  migrate(target);
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  assert.ok(!('@ohif/app' in pkg.peerDependencies));
  // Kept and rewritten: they still resolve in a checkout.
  assert.equal(pkg.peerDependencies['@ohif/extension-cornerstone-dicom-sr'], hostRange);
});

test("migrate's published @ohif list matches the SDK in pluginExternals.js", () => {
  // scripts/verify-tarballs.mjs takes the published set from the same place.
  const require = createRequire(import.meta.url);
  const { hostSharedPackages } = require('../../../.rspack/pluginExternals.js');
  const sdk = hostSharedPackages.filter(name => name.startsWith('@ohif/') && name !== '@ohif/ui');
  assert.ok(sdk.length > 0, 'pluginExternals.js still lists the shared @ohif packages');
  // The bin runs on load, so read its source.
  const [, listSource = ''] =
    fs.readFileSync(bin, 'utf8').match(/const PUBLISHED_OHIF_PACKAGES = \[([^\]]*)\];/) ?? [];
  const published = [...listSource.matchAll(/'([^']+)'/g)].map(m => m[1]);
  assert.deepEqual([...published].sort(), [...sdk].sort());
});

test('migrate flags a missing or different packageManager without writing it', () => {
  const expected = JSON.parse(
    fs.readFileSync(path.join(templatesRoot, 'workspace', 'package.json'), 'utf8')
  ).packageManager;
  const readPm = target =>
    JSON.parse(fs.readFileSync(path.join(target, 'package.json'), 'utf8')).packageManager;
  const setPm = (target, value) => {
    const pkgPath = path.join(target, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    pkg.packageManager = value;
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
  };

  // Missing: flagged with the version to add, and never written.
  const missing = scaffoldCliEra('extension', 'pm-missing');
  const report = migrate(missing, '--dry-run');
  assert.ok(report.includes(`[flag]    package.json has no "packageManager"`), report);
  assert.ok(report.includes(`add "packageManager": "${expected}"`), report);
  migrate(missing);
  assert.equal(readPm(missing), undefined, 'migrate must not write packageManager');

  // Different: flagged, and left as the author set it.
  const different = scaffoldCliEra('extension', 'pm-different');
  setPm(different, 'yarn@1.22.22');
  assert.ok(migrate(different, '--dry-run').includes('"packageManager" is "yarn@1.22.22"'));
  migrate(different);
  assert.equal(readPm(different), 'yarn@1.22.22');

  // Matching: no packageManager flag at all.
  const matching = scaffoldCliEra('extension', 'pm-matching');
  setPm(matching, expected);
  assert.ok(!migrate(matching, '--dry-run').includes('packageManager'));
});

// A minimal OHIF checkout (the two markers findCheckoutRoot looks for, plus a
// root package.json) holding a CLI-era plugin in its extensions/ or modes/.
function scaffoldInTree(kind, name) {
  const standalone = scaffoldCliEra(kind, name);
  const checkout = fs.mkdtempSync(path.join(os.tmpdir(), 'coh-checkout-'));
  fs.writeFileSync(
    path.join(checkout, 'pnpm-workspace.yaml'),
    "packages:\n  - 'extensions/*'\n  - 'modes/*'\n"
  );
  fs.mkdirSync(path.join(checkout, 'platform', 'app'), { recursive: true });
  fs.writeFileSync(path.join(checkout, 'platform', 'app', 'pluginConfig.json'), '{}\n');
  fs.writeFileSync(
    path.join(checkout, 'package.json'),
    JSON.stringify({ name: 'ohif-monorepo-root', version: '3.14.0-beta.68', private: true })
  );
  // The app's and an SDK package's pinned dependencies, where migrate reads the
  // shared packages' versions in-tree.
  fs.writeFileSync(
    path.join(checkout, 'platform', 'app', 'package.json'),
    JSON.stringify({
      name: '@ohif/app',
      dependencies: {
        react: '19.2.7',
        'react-dom': '19.2.7',
        'react-router': '6.30.3',
        'react-router-dom': '6.30.3',
        i18next: '19.9.2',
        'react-i18next': '12.3.1',
      },
    })
  );
  fs.mkdirSync(path.join(checkout, 'extensions', 'cornerstone'), { recursive: true });
  fs.writeFileSync(
    path.join(checkout, 'extensions', 'cornerstone', 'package.json'),
    JSON.stringify({
      name: '@ohif/extension-cornerstone',
      dependencies: { '@cornerstonejs/core': '5.12.0', '@cornerstonejs/tools': '5.12.0' },
    })
  );
  const target = path.join(checkout, kind === 'extension' ? 'extensions' : 'modes', name);
  fs.cpSync(standalone, target, { recursive: true });
  return { checkout, target };
}

test('migrate inside an OHIF checkout leaves the plugin as --in-tree scaffolds one', () => {
  const { checkout, target } = scaffoldInTree('mode', 'my-tree-mode');
  const report = migrate(target);
  assert.ok(report.includes(`inside the OHIF checkout at ${checkout}`), report);
  assert.ok(report.includes('Next: pnpm run install:update-lockfile at the checkout root'), report);
  assert.ok(!report.includes('packageManager'), 'no packageManager flag in-tree');

  const pkg = JSON.parse(fs.readFileSync(path.join(target, 'package.json'), 'utf8'));
  assert.equal(pkg.peerDependencies['@ohif/core'], 'workspace:*');
  assert.equal(pkg.private, true);
  assert.equal(pkg.version, '3.14.0-beta.68');
  // The root provides the toolchain: only cross-env is added. (The fixture's own
  // babel and dotenv entries are the author's, left for the flags to handle.)
  assert.equal(pkg.devDependencies['cross-env'], '7.0.3');
  assert.ok(!('@rspack/cli' in pkg.devDependencies) && !('@rspack/core' in pkg.devDependencies));
  assert.ok(!fs.existsSync(path.join(target, 'pnpm-workspace.yaml')));
  assert.ok(!fs.existsSync(path.join(target, '.npmrc')));
  assert.ok(fs.existsSync(path.join(target, '.rspack/rspack.prod.js')));

  const second = migrate(target, '--dry-run');
  assert.match(second, /\n0 rewrite\(s\) pending/);
});

test("migrate inside a checkout removes nested pnpm settings, the root's toolchain and packageManager", () => {
  const { target } = scaffoldInTree('extension', 'my-tree-extension');
  const workspaceTemplate = fs.readFileSync(
    path.join(templatesRoot, 'extension/pnpm-workspace.yaml'),
    'utf8'
  );
  fs.writeFileSync(
    path.join(target, 'pnpm-workspace.yaml'),
    `${workspaceTemplate}overrides:\n  lodash: 4.17.21\n`
  );
  fs.writeFileSync(path.join(target, '.npmrc'), 'auto-install-peers=false\n');
  withDevDeps(target, { '@rspack/core': '1.3.0' }, { packageManager: 'pnpm@12.8.1' });

  const report = migrate(target, '--dry-run');
  assert.ok(
    report.includes(
      'remove pnpm-workspace.yaml (a nested copy makes pnpm treat this folder as its own workspace'
    ),
    report
  );
  assert.ok(report.includes('it also set "overrides:", "lodash: 4.17.21"'), report);
  assert.ok(!/remove \.npmrc[^\n]*it also set/.test(report), 'the template .npmrc has no extras');
  assert.ok(report.includes('devDependencies: remove @rspack/core'), report);
  assert.ok(report.includes('packageManager: drop "pnpm@12.8.1"'), report);

  migrate(target);
  assert.ok(!fs.existsSync(path.join(target, 'pnpm-workspace.yaml')));
  assert.ok(!fs.existsSync(path.join(target, '.npmrc')));
  const pkg = JSON.parse(fs.readFileSync(path.join(target, 'package.json'), 'utf8'));
  assert.ok(!('@rspack/core' in pkg.devDependencies));
  assert.ok(!('packageManager' in pkg));
});

// Read a fixture's package.json, change it, and write it back.
test("migrate inside a checkout points jest and Babel at the checkout's setup", () => {
  // The CLI-era mode runs jest and carries its own babel.config.js, as the
  // checkout's own plugins do (theirs re-export the root config).
  const { target } = scaffoldInTree('mode', 'babel-tree-mode');

  const report = migrate(target, '--dry-run');
  assert.ok(!report.includes('runs jest'), 'the checkout installs and runs jest');
  assert.ok(!report.includes('no longer used'), 'Babel is still used in-tree');
  for (const needle of [
    "babel.config.js: replace it with module.exports = require('../../babel.config.js');",
    "package.json devDependencies: the Babel packages (@babel/*) are provided by the checkout's root install — remove them",
  ]) {
    assert.ok(report.includes(needle), `report must mention: ${needle}\n---\n${report}`);
  }
  // @babel/runtime stays a dependency, so a range on it is flagged for pinning.
  const pinLines = report.split('\n').filter(line => line.includes('not pinned to exact versions'));
  assert.ok(pinLines.some(line => line.includes('@babel/runtime@^7.20.13')), report);
  assert.ok(!pinLines.some(line => line.includes('@babel/plugin')), report);

  fs.writeFileSync(
    path.join(target, 'babel.config.js'),
    "module.exports = require('../../babel.config.js');\n"
  );
  assert.ok(!migrate(target, '--dry-run').includes('babel.config.js: replace it'));
});

function editPackage(target, edit) {
  const pkgPath = path.join(target, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  edit(pkg);
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
}

test('migrate moves @ohif dependencies to peers outside a checkout', () => {
  // Like master's modes/usAnnotation, which lists its OHIF packages as
  // workspace:* dependencies.
  const target = scaffoldCliEra('mode', 'ohif-deps-mode');
  editPackage(target, pkg => {
    delete pkg.peerDependencies['@ohif/core'];
    Object.assign(pkg.dependencies, {
      '@ohif/core': 'workspace:*',
      '@ohif/extension-ultrasound-pleura-bline': 'workspace:*',
    });
    Object.assign(pkg.devDependencies, { '@ohif/ui-next': 'workspace:*', '@ohif/i18n': '3.12.0' });
  });

  const report = migrate(target);
  assert.ok(
    report.includes(
      `dependencies: move "@ohif/extension-ultrasound-pleura-bline" "workspace:*" to peerDependencies "${hostRange}" (the host provides it; outside a checkout workspace:* cannot be installed)`
    ),
    report
  );
  assert.ok(report.includes('devDependencies: move "@ohif/ui-next" "workspace:*"'), report);
  // As a peer, the unpublished extension gets the existing flag.
  assert.ok(report.includes('@ohif/extension-ultrasound-pleura-bline is no longer published'), report);

  const pkg = JSON.parse(fs.readFileSync(path.join(target, 'package.json'), 'utf8'));
  assert.ok(!Object.keys(pkg.dependencies).some(name => name.startsWith('@ohif/')), 'no @ohif dependency left');
  for (const name of ['@ohif/core', '@ohif/extension-ultrasound-pleura-bline', '@ohif/ui-next']) {
    assert.equal(pkg.peerDependencies[name], hostRange, name);
  }
  assert.equal(pkg.devDependencies['@ohif/i18n'], '3.12.0', 'a dev copy at a real version stays');
  assert.ok(!('@ohif/ui-next' in pkg.devDependencies));
  assert.ok(!migrate(target, '--dry-run').includes('move "@ohif/'), 'second run moves nothing');
});

test("migrate moves shared cornerstone and dcmjs dependencies to peers on the host's line", () => {
  // Like MONAI Label's 3.11-era extension.
  const target = scaffoldCliEra('extension', 'cs3-extension');
  editPackage(target, pkg => {
    Object.assign(pkg.dependencies, {
      '@cornerstonejs/core': '^3.32.5',
      '@cornerstonejs/adapters': '^3.32.5',
      '@cornerstonejs/codec-charls': '^1.2.3',
      dcmjs: '0.29.0',
    });
    pkg.devDependencies['@cornerstonejs/core'] = '^3.32.5';
  });

  const report = migrate(target);
  for (const needle of [
    'dependencies: move "@cornerstonejs/core" "^3.32.5" to peerDependencies "^5.0.0" (the host provides @cornerstonejs/core 5',
    'dependencies: move "dcmjs" "0.29.0" to peerDependencies "^0.52.0"',
    // The dev copy is the author's: flagged, not rewritten.
    'devDependencies["@cornerstonejs/core"]: "^3.32.5" — the host runs @cornerstonejs/core 5; update your dev copy to a 5.x release',
    "devDependencies: dcmjs is a peer now, and peers aren't installed — if your code or tests import it, add a 0.52.x release",
    // Released with core but not shared, so it stays bundled and must match.
    'dependencies["@cornerstonejs/adapters"]: "^3.32.5" — cornerstone\'s packages are released together, and the host runs @cornerstonejs/core 5.x',
  ]) {
    assert.ok(report.includes(needle), `report must mention: ${needle}\n---\n${report}`);
  }
  // A codec has its own release line, so it isn't flagged with cornerstone.
  assert.ok(!report.includes('["@cornerstonejs/codec-charls"]'), report);
  // The entries flagged above aren't also asked to be pinned.
  const pinFlags = report.split('\n').filter(line => line.includes('not pinned to exact versions'));
  assert.ok(pinFlags.some(line => line.includes('@cornerstonejs/codec-charls')), pinFlags.join('\n'));
  assert.ok(!pinFlags.some(line => /adapters|@cornerstonejs\/core/.test(line)), pinFlags.join('\n'));
  assert.ok(/Note: the versions of [^\n]*@cornerstonejs\/core[^\n]*dcmjs/.test(report), report);

  const pkg = JSON.parse(fs.readFileSync(path.join(target, 'package.json'), 'utf8'));
  assert.equal(pkg.peerDependencies['@cornerstonejs/core'], '^5.0.0');
  assert.equal(pkg.peerDependencies.dcmjs, '^0.52.0');
  assert.ok(!('@cornerstonejs/core' in pkg.dependencies) && !('dcmjs' in pkg.dependencies));
  assert.equal(pkg.devDependencies['@cornerstonejs/core'], '^3.32.5');
  assert.ok(!migrate(target, '--dry-run').includes('move "@cornerstonejs/core"'), 'second run moves nothing');
});

test("migrate inside a checkout keeps shared packages in place, on the checkout's versions", () => {
  const { target } = scaffoldInTree('extension', 'cs3-tree-extension');
  editPackage(target, pkg => {
    Object.assign(pkg.dependencies, {
      '@cornerstonejs/core': '^3.32.5',
      '@cornerstonejs/adapters': '^3.32.5',
      i18next: '^17.0.3',
      '@ohif/core': '^3.11.0',
    });
    pkg.devDependencies['@cornerstonejs/core'] = '^3.32.5';
    // Already on the checkout's major: left alone, even though not exact.
    pkg.peerDependencies['react-dom'] = '^19.0.0';
  });

  const report = migrate(target);
  assert.ok(
    report.includes(
      'dependencies["@cornerstonejs/core"]: "^3.32.5" -> "5.12.0" (the checkout installs @cornerstonejs/core 5.12.0)'
    ),
    report
  );
  assert.ok(
    report.includes('dependencies["@ohif/core"]: "^3.11.0" -> "workspace:*"'),
    report
  );
  assert.ok(
    report.includes('the host runs @cornerstonejs/core 5.12.0; update it to the same release'),
    report
  );

  const pkg = JSON.parse(fs.readFileSync(path.join(target, 'package.json'), 'utf8'));
  assert.equal(pkg.dependencies['@cornerstonejs/core'], '5.12.0');
  assert.equal(pkg.devDependencies['@cornerstonejs/core'], '5.12.0');
  assert.equal(pkg.dependencies.i18next, '19.9.2', 'stays a dependency, on the checkout version');
  assert.ok(!('i18next' in pkg.peerDependencies));
  assert.equal(pkg.dependencies['@ohif/core'], 'workspace:*');
  assert.equal(pkg.peerDependencies.react, '19.2.7', "React 18 moves to the checkout's 19");
  assert.equal(pkg.peerDependencies['react-dom'], '^19.0.0');
  assert.ok(!migrate(target, '--dry-run').includes('-> "5.12.0"'), 'second run rewrites nothing');
});

// host-shared-majors.json is checked against the viewer's installed copies by
// platform/app/src/runtimeShared.test.js; this keeps the templates on it too.
test("the templates' shared packages are on the host's majors", () => {
  const majors = JSON.parse(
    fs.readFileSync(new URL('../host-shared-majors.json', import.meta.url), 'utf8')
  );
  for (const tpl of ['extension', 'mode']) {
    const manifest = JSON.parse(fs.readFileSync(path.join(templatesRoot, tpl, 'package.json'), 'utf8'));
    for (const section of ['peerDependencies', 'devDependencies']) {
      for (const [name, spec] of Object.entries(manifest[section] ?? {})) {
        if (name in majors) {
          const [, major, minor] = spec.match(/(\d+)\.(\d+)/);
          assert.equal(
            `${tpl} ${section} ${name}@${major === '0' ? `0.${minor}` : major}`,
            `${tpl} ${section} ${name}@${majors[name]}`
          );
        }
      }
    }
  }
});
