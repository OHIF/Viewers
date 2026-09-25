// WS5.8: end-to-end scaffold smoke — scaffold → install → build → UMD global
// assert → vitest. Repo-side manual gate (scripts/ is outside the published
// `files` list; requires network for the scaffolds' pnpm install):
//
//   node platform/create-ohif/scripts/scaffold-smoke.mjs
//
// On failure the temp scaffolds are kept and their paths printed so the
// failing artifact can be inspected.
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const bin = fileURLToPath(new URL('../bin/create-ohif.mjs', import.meta.url));

let current = '(setup)';
function step(label, fn) {
  current = label;
  fn();
  console.log(`ok: ${label}`);
}

function run(cmd, cwd) {
  // shell: true keeps pnpm resolution Windows-safe (pnpm.cmd).
  execSync(cmd, { cwd, stdio: 'inherit', shell: true });
}

// Minimal DOM stub: the extension template compiles CSS with style-loader,
// whose runtime touches document at UMD eval time (contract: styles are
// injected by the bundle itself — there is deliberately no dist/index.css).
function makeElement() {
  return {
    children: [],
    firstChild: undefined,
    setAttribute() {},
    removeAttribute() {},
    appendChild(child) {
      this.children.push(child);
      return child;
    },
    removeChild() {},
    insertBefore(child) {
      this.children.push(child);
      return child;
    },
  };
}

// Evaluate a built UMD under stubbed host globals and return the sandbox.
// The wrapper sees no module/exports/define, so it takes the global branch
// (globalObject resolves to `self`) and assigns self[pkg.name].
function evaluateUmd(bundlePath) {
  const head = makeElement();
  const sandbox = {
    react: {},
    'react-dom': {},
    'react/jsx-runtime': {},
    '@ohif/core': {},
    document: {
      head,
      createElement: makeElement,
      createTextNode: text => ({ text }),
      querySelector: selector => (selector === 'head' ? head : null),
      querySelectorAll: () => [],
      getElementsByTagName: tag => (tag === 'head' ? [head] : []),
    },
  };
  sandbox.self = sandbox;
  sandbox.window = sandbox;
  vm.runInNewContext(readFileSync(bundlePath, 'utf8'), sandbox, { filename: bundlePath });
  return sandbox;
}

const keep = [];
try {
  const extParent = mkdtempSync(path.join(tmpdir(), 'ohif-smoke-ext-'));
  const modeParent = mkdtempSync(path.join(tmpdir(), 'ohif-smoke-mode-'));
  keep.push(extParent, modeParent);
  const extDir = path.join(extParent, 'smoke-ext');
  const modeDir = path.join(modeParent, 'smoke-mode');

  step('scaffold smoke-ext (extension: viewport,panel,commands)', () => {
    run(
      `node "${bin}" smoke-ext --template extension --modules viewport,panel,commands --yes --dir "${extParent}"`
    );
    assert.ok(existsSync(path.join(extDir, 'package.json')));
  });

  step('scaffold smoke-mode (mode)', () => {
    run(`node "${bin}" smoke-mode --template mode --yes --dir "${modeParent}"`);
    assert.ok(existsSync(path.join(modeDir, 'package.json')));
  });

  // Standalone context: the scaffold's own .npmrc (auto-install-peers=false)
  // applies; unmet-peer warnings for @ohif/core are expected and non-fatal.
  step('pnpm install (smoke-ext)', () => run('pnpm install', extDir));
  step('pnpm install (smoke-mode)', () => run('pnpm install', modeDir));

  step('pnpm build (smoke-ext)', () => run('pnpm build', extDir));
  step('pnpm build (smoke-mode)', () => run('pnpm build', modeDir));

  step('build artifacts', () => {
    assert.ok(existsSync(path.join(extDir, 'dist/index.umd.js')), 'extension dist/index.umd.js');
    assert.ok(existsSync(path.join(modeDir, 'dist/index.umd.js')), 'mode dist/index.umd.js');
    // Contract: no extracted stylesheet — style-loader injects at runtime. An
    // index.css reappearing means the template regressed to CssExtract, whose
    // output is silently never loaded when the host bundles the UMD.
    assert.ok(
      !existsSync(path.join(extDir, 'dist/index.css')),
      'extension must not emit dist/index.css (styles are runtime-injected)'
    );
  });

  step('UMD global contract (smoke-ext)', () => {
    const w = evaluateUmd(path.join(extDir, 'dist/index.umd.js'));
    const ext = w['smoke-ext'];
    // export: 'default' → the global IS the extension object, no .default.
    assert.equal(typeof ext, 'object', 'window["smoke-ext"] assigned');
    assert.equal(ext.id, 'smoke-ext', 'id === package name');
    assert.equal(typeof ext.getViewportModule, 'function');
    assert.equal(typeof ext.getPanelModule, 'function');
    assert.equal(typeof ext.getCommandsModule, 'function');
    assert.equal(ext.getToolbarModule, undefined, 'unselected module pruned');
    assert.ok(!w.React, 'react must be externalized, not bundled or leaked');
    assert.ok(
      w.document.head.children.length > 0,
      'style-loader must inject the compiled stylesheet at eval'
    );
  });

  step('UMD global contract (smoke-mode)', () => {
    const w = evaluateUmd(path.join(modeDir, 'dist/index.umd.js'));
    const mode = w['smoke-mode'];
    assert.equal(typeof mode, 'object', 'window["smoke-mode"] assigned');
    assert.equal(mode.id, 'smoke-mode', 'id === package name');
    assert.equal(typeof mode.modeFactory, 'function');
    assert.ok(!w.React, 'react must be externalized, not bundled or leaked');
  });

  step('pnpm test (smoke-ext)', () => run('pnpm test', extDir));
  step('pnpm test (smoke-mode)', () => run('pnpm test', modeDir));

  for (const dir of keep) {
    rmSync(dir, { recursive: true, force: true });
  }
  console.log('scaffold smoke passed');
} catch (error) {
  console.error(`\nscaffold smoke FAILED at step: ${current}`);
  console.error(error?.message ?? error);
  if (keep.length) {
    console.error(`scaffolds kept for inspection: ${keep.join(', ')}`);
  }
  process.exit(1);
}
