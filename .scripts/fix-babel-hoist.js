/**
 * Guards against stale node_modules where
 * @babel/plugin-transform-class-static-block@7.28.x resolves a nested
 * @babel/helper-create-class-features-plugin@7.27.x (no buildNamedEvaluationVisitor).
 *
 * Invoked from platform/app `build:viewer:ci`. Search deploy logs for: FIX_BABEL_HOIST_RAN
 */
const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');

const MARKER = 'FIX_BABEL_HOIST_RAN';
const MIN_HELPER_FOR_PLUGIN_28 = '7.28.6';
const MIN_PLUGIN_USING_NAMED_EVAL = '7.28.6';

function log(line) {
  console.log(`[${MARKER}] ${line}`);
}

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

function paths(nodeModules) {
  const pluginDir = path.join(nodeModules, '@babel/plugin-transform-class-static-block');
  const helperDir = path.join(nodeModules, '@babel/helper-create-class-features-plugin');
  const pluginNodeModules = path.join(pluginDir, 'node_modules');
  const nestedHelperDir = path.join(
    pluginNodeModules,
    '@babel',
    'helper-create-class-features-plugin'
  );
  return { pluginDir, helperDir, pluginNodeModules, nestedHelperDir };
}

function resolvedUnderPlugin(pluginDir, resolved) {
  const prefix = path.join(pluginDir, 'node_modules') + path.sep;
  return resolved.startsWith(prefix);
}

const VERIFY_CODE = `
const path = require('path');
const { createRequire } = require('module');
const pluginDir = process.env.FIX_BABEL_PLUGIN_DIR;
const helperDir = process.env.FIX_BABEL_HELPER_DIR;
if (!pluginDir || !helperDir) {
  throw new Error('FIX_BABEL_PLUGIN_DIR and FIX_BABEL_HELPER_DIR are required');
}
const req = createRequire(path.join(pluginDir, 'lib/index.js'));
const resolved = req.resolve('@babel/helper-create-class-features-plugin');
const helper = req('@babel/helper-create-class-features-plugin');
const prefix = path.join(pluginDir, 'node_modules') + path.sep;
console.log(
  JSON.stringify({
    resolved,
    resolvedUnderPlugin: resolved.startsWith(prefix),
    buildNamedEvaluationVisitor: typeof helper.buildNamedEvaluationVisitor,
    helperExportOk: typeof helper.buildNamedEvaluationVisitor === 'function',
  })
);
`;

/**
 * Fresh Node process — avoids require.cache keeping a deleted nested helper.
 */
function verifyInSubprocess(pluginDir, helperDir) {
  const result = spawnSync(process.execPath, ['-e', VERIFY_CODE], {
    env: {
      ...process.env,
      FIX_BABEL_PLUGIN_DIR: pluginDir,
      FIX_BABEL_HELPER_DIR: helperDir,
    },
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || 'verify subprocess failed');
  }

  return JSON.parse(result.stdout.trim());
}

function diagnose(nodeModules) {
  const { pluginDir, helperDir, nestedHelperDir } = paths(nodeModules);

  const report = {
    nodeModules,
    pluginDir,
    pluginExists: fs.existsSync(pluginDir),
    pluginVersion: readVersion(pluginDir),
    helperDir,
    helperExists: fs.existsSync(helperDir),
    rootHelperVersion: readVersion(helperDir),
    nestedHelperExists: fs.existsSync(nestedHelperDir),
    nestedHelperVersion: readVersion(nestedHelperDir),
    helperResolvedFromPlugin: null,
    resolvedUnderPlugin: null,
    buildNamedEvaluationVisitor: null,
    helperExportOk: false,
  };

  if (!report.pluginExists) {
    return report;
  }

  try {
    const verify = verifyInSubprocess(pluginDir, helperDir);
    Object.assign(report, verify);
    report.helperResolvedFromPlugin = verify.resolved;
  } catch (error) {
    report.resolveError = error.message;
  }

  return report;
}

function checkState(nodeModules) {
  const report = diagnose(nodeModules);
  const { pluginVersion, rootHelperVersion, nestedHelperVersion, helperExportOk } =
    report;

  if (!report.pluginExists) {
    return { ok: true, reason: 'plugin not installed', report };
  }

  if (!pluginNeedsNewHelper(pluginVersion)) {
    return {
      ok: true,
      reason: 'plugin does not need buildNamedEvaluationVisitor',
      report,
    };
  }

  const rootBad = helperIsTooOld(rootHelperVersion);
  const nestedBad =
    report.nestedHelperExists && helperIsTooOld(nestedHelperVersion);
  const shadowedByPluginCopy = report.resolvedUnderPlugin === true;

  if (!rootBad && !nestedBad && !shadowedByPluginCopy && helperExportOk) {
    return { ok: true, reason: 'aligned', report };
  }

  return {
    ok: false,
    report,
    rootBad,
    nestedBad,
    shadowedByPluginCopy,
    helperExportOk,
  };
}

function removeDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
    log(`removed ${dir}`);
  }
}

/**
 * Drop all of plugin/node_modules so Node cannot resolve a nested helper@7.27.x.
 */
function removePluginShadowTree(nodeModules) {
  const { pluginNodeModules } = paths(nodeModules);
  if (fs.existsSync(pluginNodeModules)) {
    removeDir(pluginNodeModules);
    return true;
  }
  return false;
}

function writeReport(root, payload) {
  const reportPath = path.join(root, 'fix-babel-hoist-report.json');
  fs.writeFileSync(reportPath, `${JSON.stringify(payload, null, 2)}\n`);
  log(`wrote ${reportPath}`);
}

function finishOk(root, startedAt, state, status) {
  writeReport(root, {
    marker: MARKER,
    status,
    reason: state.reason,
    startedAt,
    report: state.report,
  });
  log(`status=${status} reason=${state.reason}`);
  log(`resolved=${state.report.helperResolvedFromPlugin}`);
  log('END');
}

function main() {
  const startedAt = new Date().toISOString();
  const cwd = process.cwd();
  const root = repoRoot();
  const nodeModules = path.join(root, 'node_modules');
  const { pluginDir, helperDir, pluginNodeModules } = paths(nodeModules);

  log(`START at ${startedAt}`);
  log(`cwd=${cwd}`);
  log(`repoRoot=${root}`);
  log(`NETLIFY=${process.env.NETLIFY || '(unset)'}`);
  log(`CONTEXT=${process.env.CONTEXT || '(unset)'}`);

  let state = checkState(nodeModules);
  log(`before: ${JSON.stringify(state.report, null, 2)}`);

  if (state.ok) {
    finishOk(root, startedAt, state, 'ok');
    return;
  }

  // Root helper is fine; nested / plugin node_modules shadows it.
  if (!state.rootBad && (state.nestedBad || state.shadowedByPluginCopy || !state.helperExportOk)) {
    log('status=repairing plugin shadow tree (remove plugin/node_modules)');
    removePluginShadowTree(nodeModules);
    state = checkState(nodeModules);
    log(`after shadow removal: ${JSON.stringify(state.report, null, 2)}`);
    if (state.ok) {
      finishOk(root, startedAt, state, 'fixed-shadow-only');
      return;
    }
  }

  log('status=repairing full Babel class-features packages');
  removeDir(pluginNodeModules);
  removeDir(helperDir);
  removeDir(pluginDir);

  log('running yarn install --pure-lockfile');
  execSync('yarn install --pure-lockfile', {
    cwd: root,
    stdio: 'inherit',
  });

  if (removePluginShadowTree(nodeModules)) {
    log('stripped plugin/node_modules re-created by yarn install');
  }

  state = checkState(nodeModules);
  log(`after: ${JSON.stringify(state.report, null, 2)}`);

  if (!state.ok) {
    writeReport(root, {
      marker: MARKER,
      status: 'failed',
      startedAt,
      report: state.report,
    });
    log('status=failed still misaligned after repair');
    log('END');
    process.exit(1);
  }

  writeReport(root, {
    marker: MARKER,
    status: 'repaired',
    startedAt,
    report: state.report,
  });
  log('status=repaired');
  log(`resolved=${state.report.helperResolvedFromPlugin}`);
  log('END');
}

main();
