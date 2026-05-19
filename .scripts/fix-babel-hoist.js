/**
 * Netlify restores cached node_modules, then runs yarn install. That can leave
 * @babel/plugin-transform-class-static-block@7.28.x with a stale
 * @babel/helper-create-class-features-plugin@7.27.x (missing buildNamedEvaluationVisitor).
 *
 * Run once before the production build (see platform/app/netlify.toml).
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { createRequire } = require('module');

const MIN_HELPER_FOR_PLUGIN_28 = '7.28.6';
const MIN_PLUGIN_USING_NAMED_EVAL = '7.28.6';

function repoRoot() {
  return execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim();
}

function readVersion(dir) {
  const pkgPath = path.join(dir, 'package.json');
  if (!fs.existsSync(pkgPath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(pkgPath, 'utf8')).version;
}

function parseVersion(version) {
  return version.split('.').map(part => parseInt(part, 10) || 0);
}

function semverLt(a, b) {
  const av = parseVersion(a);
  const bv = parseVersion(b);
  for (let i = 0; i < Math.max(av.length, bv.length); i++) {
    const diff = (av[i] || 0) - (bv[i] || 0);
    if (diff < 0) return true;
    if (diff > 0) return false;
  }
  return false;
}

function pluginNeedsNewHelper(pluginVersion) {
  return pluginVersion && !semverLt(pluginVersion, MIN_PLUGIN_USING_NAMED_EVAL);
}

function helperIsTooOld(helperVersion) {
  return !helperVersion || semverLt(helperVersion, MIN_HELPER_FOR_PLUGIN_28);
}

function resolveHelperFromPlugin(pluginDir) {
  const req = createRequire(path.join(pluginDir, 'lib/index.js'));
  return req('@babel/helper-create-class-features-plugin');
}

function checkState(nodeModules) {
  const pluginDir = path.join(nodeModules, '@babel/plugin-transform-class-static-block');
  const helperDir = path.join(nodeModules, '@babel/helper-create-class-features-plugin');

  if (!fs.existsSync(pluginDir)) {
    return { ok: true, reason: 'plugin not installed' };
  }

  const pluginVersion = readVersion(pluginDir);
  if (!pluginNeedsNewHelper(pluginVersion)) {
    return { ok: true, reason: 'plugin does not need buildNamedEvaluationVisitor' };
  }

  const nestedHelperDir = path.join(
    pluginDir,
    'node_modules',
    '@babel',
    'helper-create-class-features-plugin'
  );
  const rootHelperVersion = readVersion(helperDir);
  const nestedHelperVersion = readVersion(nestedHelperDir);

  let helperExportOk = false;
  try {
    helperExportOk =
      typeof resolveHelperFromPlugin(pluginDir).buildNamedEvaluationVisitor === 'function';
  } catch {
    helperExportOk = false;
  }

  const rootBad = helperIsTooOld(rootHelperVersion);
  const nestedBad =
    fs.existsSync(nestedHelperDir) && helperIsTooOld(nestedHelperVersion);

  if (!rootBad && !nestedBad && helperExportOk) {
    return {
      ok: true,
      pluginVersion,
      rootHelperVersion,
      nestedHelperVersion,
    };
  }

  return {
    ok: false,
    pluginVersion,
    rootHelperVersion,
    nestedHelperVersion,
    rootBad,
    nestedBad,
    helperExportOk,
  };
}

function removeDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function main() {
  const root = repoRoot();
  const nodeModules = path.join(root, 'node_modules');
  const pluginDir = path.join(nodeModules, '@babel/plugin-transform-class-static-block');
  const helperDir = path.join(nodeModules, '@babel/helper-create-class-features-plugin');
  const nestedBabelDir = path.join(pluginDir, 'node_modules', '@babel');

  let state = checkState(nodeModules);

  if (state.ok) {
    console.log(`fix-babel-hoist: OK (${state.reason || 'aligned'})`);
    return;
  }

  console.log('fix-babel-hoist: repairing stale Babel class-features hoisting');
  console.log(
    JSON.stringify(
      {
        plugin: state.pluginVersion,
        rootHelper: state.rootHelperVersion,
        nestedHelper: state.nestedHelperVersion,
        helperExportOk: state.helperExportOk,
      },
      null,
      2
    )
  );

  removeDir(nestedBabelDir);
  if (state.rootBad || !state.helperExportOk) {
    removeDir(helperDir);
  }

  execSync('yarn install --pure-lockfile', {
    cwd: root,
    stdio: 'inherit',
  });

  state = checkState(nodeModules);
  if (!state.ok) {
    console.error('fix-babel-hoist: still misaligned after yarn install');
    console.error(JSON.stringify(state, null, 2));
    process.exit(1);
  }

  console.log('fix-babel-hoist: repaired successfully');
}

main();
