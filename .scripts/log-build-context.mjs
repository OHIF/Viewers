#!/usr/bin/env node
/**
 * Logs build context (OHIF branch/version, CS3D source) for diagnosing build issues on GitHub.
 * Run from repo root. Used by version.mjs and can be invoked from CI workflows.
 */
import { execa } from 'execa';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

function log(msg) {
  console.log(`[build-context] ${msg}`);
}

async function detectCs3dSource() {
  const libsCs3d = path.join(REPO_ROOT, 'libs/@cornerstonejs');
  const coreInNodeModules = path.join(REPO_ROOT, 'node_modules/@cornerstonejs/core');

  try {
    const libsExists = await fs.access(libsCs3d).then(() => true).catch(() => false);
    if (!libsExists) {
      return { source: 'npm', detail: 'published @cornerstonejs packages (no libs/@cornerstonejs)' };
    }

    const coreStat = await fs.lstat(coreInNodeModules).catch(() => null);
    const isSymlink = coreStat?.isSymbolicLink();
    if (isSymlink) {
      const target = await fs.readlink(coreInNodeModules);
      return { source: 'integrated', detail: `linked from libs/@cornerstonejs (→ ${target})` };
    }

    return { source: 'npm', detail: 'published @cornerstonejs packages (libs exists but not linked)' };
  } catch {
    return { source: 'unknown', detail: 'could not detect' };
  }
}

async function getCs3dVersion() {
  try {
    const corePkg = path.join(REPO_ROOT, 'node_modules/@cornerstonejs/core/package.json');
    const pkg = JSON.parse(await fs.readFile(corePkg, 'utf-8'));
    return pkg.version || 'unknown';
  } catch {
    return 'unknown';
  }
}

async function getCs3dBranchFromLibs() {
  try {
    const libsCs3d = path.join(REPO_ROOT, 'libs/@cornerstonejs');
    const { stdout } = await execa('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
      cwd: libsCs3d,
    });
    return stdout;
  } catch {
    return null;
  }
}

async function run() {
  const inCI = process.env.GITHUB_ACTIONS === 'true';
  const buildType = inCI ? (process.env.BUILD_TYPE || 'ohif-upstream') : 'local';

  log('═══════════════════════════════════════════════════════════════');
  log('Build context (for diagnosing GitHub build issues)');
  log('═══════════════════════════════════════════════════════════════');

  if (inCI) {
    log(`Build type: ${process.env.BUILD_TYPE || 'ohif-upstream'}`);
    log(`GitHub repo: ${process.env.GITHUB_REPOSITORY || 'unknown'}`);
    log(`GitHub ref: ${process.env.GITHUB_REF || 'unknown'}`);
    log(`GitHub SHA: ${process.env.GITHUB_SHA || 'unknown'}`);
    log(`Workflow: ${process.env.GITHUB_WORKFLOW || 'unknown'}`);
  }

  try {
    const { stdout: branch } = await execa('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
      cwd: REPO_ROOT,
    });
    const { stdout: sha } = await execa('git', ['rev-parse', '--short', 'HEAD'], {
      cwd: REPO_ROOT,
    });
    log(`OHIF branch: ${branch} (${sha})`);
  } catch {
    log('OHIF branch: (not a git repo or error)');
  }

  const cs3d = await detectCs3dSource();
  log(`CS3D source: ${cs3d.source} — ${cs3d.detail}`);

  if (cs3d.source === 'integrated') {
    const branch = await getCs3dBranchFromLibs();
    if (branch) log(`CS3D branch (libs/@cornerstonejs): ${branch}`);
  } else {
    const ver = await getCs3dVersion();
    log(`CS3D version (@cornerstonejs/core): ${ver}`);
  }

  log('═══════════════════════════════════════════════════════════════');
}

run().catch((err) => {
  console.error('[build-context] Error:', err.message);
  process.exitCode = 1;
});
