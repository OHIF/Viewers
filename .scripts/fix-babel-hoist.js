/**
 * Guards against stale Netlify node_modules where
 * @babel/plugin-transform-class-static-block@7.28.x resolves an older
 * @babel/helper-create-class-features-plugin (no buildNamedEvaluationVisitor).
 *
 * Invoked from platform/app `build:viewer:ci` (always runs on Netlify).
 * Search deploy logs for: FIX_BABEL_HOIST_RAN
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { createRequire } = require('module');

const MARKER = 'FIX_BABEL_HOIST_RAN';
const MIN_HELPER_FOR_PLUGIN_28 = '7.28.6';
const MIN_PLUGIN_USING_NAMED_EVAL = '7.28.6';

function log(line) {
  // Prefix makes grep in Netlify / CI logs trivial.
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

function resolveHelperFromPlugin(pluginDir) {
  const req = createRequire(path.join(pluginDir, 'lib/index.js'));
  const resolved = req.resolve('@babel/helper-create-class-features-plugin');
  return {
    helper: req('@babel/helper-create-class-features-plugin'),
    resolved,
  };
}

function diagnose(nodeModules) {
  const pluginDir = path.join(nodeModules, '@babel/plugin-transform-class-static-block');
  const helperDir = path.join(nodeModules, '@babel/helper-create-class-features-plugin');
  const nestedHelperDir = path.join(
    pluginDir,
    'node_modules',
    '@babel',
    'helper-create-class-features-plugin'
  );

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
    buildNamedEvaluationVisitor: null,
    helperExportOk: false,
  };

  if (!report.pluginExists) {
    return report;
  }

  try {
    const { helper, resolved } = resolveHelperFromPlugin(pluginDir);
    report.helperResolvedFromPlugin = resolved;
    report.buildNamedEvaluationVisitor = typeof helper.buildNamedEvaluationVisitor;
    report.helperExportOk = report.buildNamedEvaluationVisitor === 'function';
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

  if (!rootBad && !nestedBad && helperExportOk) {
    return { ok: true, reason: 'aligned', report };
  }

  return {
    ok: false,
    report,
    rootBad,
    nestedBad,
    helperExportOk,
  };
}

function removeDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
    log(`removed ${dir}`);
  }
}

function writeReport(root, payload) {
  const reportPath = path.join(root, 'fix-babel-hoist-report.json');
  fs.writeFileSync(reportPath, `${JSON.stringify(payload, null, 2)}\n`);
  log(`wrote ${reportPath}`);
}

function main() {
  const startedAt = new Date().toISOString();
  const cwd = process.cwd();
  const root = repoRoot();
  const nodeModules = path.join(root, 'node_modules');
  const pluginDir = path.join(nodeModules, '@babel/plugin-transform-class-static-block');
  const helperDir = path.join(nodeModules, '@babel/helper-create-class-features-plugin');
  const nestedBabelDir = path.join(pluginDir, 'node_modules', '@babel');

  log(`START at ${startedAt}`);
  log(`cwd=${cwd}`);
  log(`repoRoot=${root}`);
  log(`NETLIFY=${process.env.NETLIFY || '(unset)'}`);
  log(`CONTEXT=${process.env.CONTEXT || '(unset)'}`);
  log(`DEPLOY_PRIME_URL=${process.env.DEPLOY_PRIME_URL || '(unset)'}`);

  let state = checkState(nodeModules);
  log(`before: ${JSON.stringify(state.report, null, 2)}`);

  if (state.ok) {
    writeReport(root, {
      marker: MARKER,
      status: 'ok',
      reason: state.reason,
      startedAt,
      report: state.report,
    });
    log(`status=ok reason=${state.reason}`);
    log('END');
    return;
  }

  log('status=repairing stale Babel hoisting');

  removeDir(nestedBabelDir);
  removeDir(helperDir);
  removeDir(pluginDir);

  log('running yarn install --pure-lockfile');
  execSync('yarn install --pure-lockfile', {
    cwd: root,
    stdio: 'inherit',
  });

  state = checkState(nodeModules);
  log(`after: ${JSON.stringify(state.report, null, 2)}`);

  if (!state.ok) {
    writeReport(root, {
      marker: MARKER,
      status: 'failed',
      startedAt,
      report: state.report,
    });
    log('status=failed still misaligned after yarn install');
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
  log('END');
}

main();
