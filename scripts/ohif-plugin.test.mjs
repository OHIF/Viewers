// Tests for scripts/ohif-plugin.mjs. Each test works in a temporary folder:
// its own pluginConfig.json, root package.json and node_modules, and a fake
// pnpm that records what it was asked to install. doctor still reads the real
// checkout's version.txt and workspace folders, so its output also mentions
// the in-tree plugins; the assertions only look at the lines under test.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { cmdAdd, cmdDoctor } from './ohif-plugin.mjs';

function makeCtx(packages) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ohif-plugin-'));
  const ctx = {
    configPath: path.join(dir, 'pluginConfig.json'),
    rootPkgPath: path.join(dir, 'package.json'),
    nodeModulesDir: path.join(dir, 'node_modules'),
    installs: [],
  };
  fs.writeFileSync(ctx.configPath, JSON.stringify({ extensions: [], modes: [] }, null, 2));
  fs.writeFileSync(ctx.rootPkgPath, JSON.stringify({ name: 'root', dependencies: {} }, null, 2));
  for (const pkg of packages) {
    const pkgDir = path.join(ctx.nodeModulesDir, pkg.name);
    fs.mkdirSync(pkgDir, { recursive: true });
    fs.writeFileSync(path.join(pkgDir, 'package.json'), JSON.stringify(pkg, null, 2));
  }
  // The packages are already "installed"; the fake only records the call and
  // adds the root dependency, as `pnpm add -w` would.
  ctx.runPnpm = args => {
    ctx.installs.push(args.join(' '));
    const rootPkg = JSON.parse(fs.readFileSync(ctx.rootPkgPath, 'utf8'));
    const spec = args[args.length - 1];
    const name = spec.slice(0, spec.lastIndexOf('@') > 0 ? spec.lastIndexOf('@') : undefined);
    rootPkg.dependencies[name] = spec.slice(name.length + 1);
    fs.writeFileSync(ctx.rootPkgPath, JSON.stringify(rootPkg, null, 2));
  };
  return ctx;
}

const trainingPackages = [
  {
    name: 'ohif-mode-training',
    version: '0.0.2',
    keywords: ['ohif-mode'],
    peerDependencies: { '@ohif/core': '>=3.13.0-beta.0 <4', 'ohif-extension-training': '^0.0.2', react: '^19.2.7' },
  },
  { name: 'ohif-extension-training', version: '0.0.2', keywords: ['ohif-extension'] },
  { name: 'react', version: '19.2.7' },
];

// Run fn with console.log captured; returns the printed lines.
function captureLog(t, fn) {
  const lines = [];
  t.mock.method(console, 'log', (...parts) => lines.push(parts.join(' ')));
  fn();
  t.mock.restoreAll();
  return lines;
}

test('add also installs and declares the OHIF plugins a mode lists as peers', t => {
  const ctx = makeCtx(trainingPackages);
  const lines = captureLog(t, () => cmdAdd(['ohif-mode-training@0.0.2', '--mode'], ctx));

  const config = JSON.parse(fs.readFileSync(ctx.configPath, 'utf8'));
  assert.deepEqual(config.modes, [{ packageName: 'ohif-mode-training' }]);
  assert.deepEqual(config.extensions, [{ packageName: 'ohif-extension-training' }]);
  assert.deepEqual(ctx.installs, [
    'add -w ohif-mode-training@0.0.2',
    'add -w ohif-extension-training@^0.0.2',
  ]);
  assert.ok(
    lines.some(line => line.includes('(a peer of ohif-mode-training)')),
    lines.join('\n')
  );
});

test('add --no-peers adds only the named package', t => {
  const ctx = makeCtx(trainingPackages);
  captureLog(t, () => cmdAdd(['ohif-mode-training@0.0.2', '--mode', '--no-peers'], ctx));

  const config = JSON.parse(fs.readFileSync(ctx.configPath, 'utf8'));
  assert.deepEqual(config.modes, [{ packageName: 'ohif-mode-training' }]);
  assert.deepEqual(config.extensions, []);
  assert.deepEqual(ctx.installs, ['add -w ohif-mode-training@0.0.2']);
});

test('add skips optional peers and follows the peers of a peer it adds', t => {
  const ctx = makeCtx([
    {
      name: 'ohif-mode-chain',
      keywords: ['ohif-mode'],
      peerDependencies: { 'ohif-extension-a': '^1.0.0', 'ohif-extension-optional': '^1.0.0' },
      peerDependenciesMeta: { 'ohif-extension-optional': { optional: true } },
    },
    {
      name: 'ohif-extension-a',
      keywords: ['ohif-extension'],
      peerDependencies: { 'ohif-extension-b': '^2.0.0' },
    },
    { name: 'ohif-extension-b', keywords: ['ohif-extension'] },
    { name: 'ohif-extension-optional', keywords: ['ohif-extension'] },
  ]);
  const lines = captureLog(t, () => cmdAdd(['ohif-mode-chain', '--mode'], ctx));

  const config = JSON.parse(fs.readFileSync(ctx.configPath, 'utf8'));
  assert.deepEqual(config.extensions, [
    { packageName: 'ohif-extension-a' },
    { packageName: 'ohif-extension-b' },
  ]);
  assert.deepEqual(ctx.installs, [
    'add -w ohif-mode-chain',
    'add -w ohif-extension-a@^1.0.0',
    'add -w ohif-extension-b@^2.0.0',
  ]);
  assert.ok(
    lines.some(line => line.includes('ohif-extension-b') && line.includes('(a peer of ohif-extension-a)')),
    lines.join('\n')
  );
});

test('doctor warns when a declared plugin peer-requires something not installed', t => {
  const ctx = makeCtx([]);
  const modeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ohif-plugin-mode-'));
  fs.writeFileSync(
    path.join(modeDir, 'package.json'),
    JSON.stringify({
      name: 'ohif-mode-linked',
      keywords: ['ohif-mode'],
      peerDependencies: {
        'ohif-extension-not-installed': '^1.0.0',
        'ohif-extension-optional-missing': '^1.0.0',
      },
      peerDependenciesMeta: { 'ohif-extension-optional-missing': { optional: true } },
    })
  );
  fs.writeFileSync(
    ctx.configPath,
    JSON.stringify({
      extensions: [],
      modes: [{ packageName: 'ohif-mode-linked', directory: modeDir.split(path.sep).join('/') }],
    })
  );

  const lines = captureLog(t, () => cmdDoctor([], ctx));
  assert.ok(
    lines.some(line =>
      line.includes(
        "[warn] ohif-mode-linked peer-requires ohif-extension-not-installed, which isn't installed"
      )
    ),
    lines.join('\n')
  );
  assert.ok(!lines.some(line => line.includes('ohif-extension-optional-missing')), lines.join('\n'));
});
