#!/usr/bin/env node
/**
 * Used by the cs3d_merged_update flow: identifies the integration branch to
 * update (bot/cs3d-merged for merged baseline) and optionally creates it.
 * Outputs the branch name for the workflow to checkout.
 *
 * For integration_requested we create bot/cs3d-pr-<n> in the workflow; this
 * script is only needed for merged_update to resolve the target branch.
 *
 * Usage:
 *   node update-open-cs3d-integration-prs.mjs --action merged-update [--default-branch main]
 *   Writes to GITHUB_OUTPUT: branch=<branch-name>
 */

import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

const MERGED_BRANCH = 'bot/cs3d-merged';

function parseArgs() {
  const args = process.argv.slice(2);
  let action = null;
  let defaultBranch = 'main';
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--action' && args[i + 1]) action = args[++i];
    if (args[i] === '--default-branch' && args[i + 1]) defaultBranch = args[++i];
  }
  return { action, defaultBranch };
}

function branchExists(branch) {
  try {
    execSync(`git rev-parse --verify "refs/heads/${branch}"`, { cwd: ROOT, stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const { action, defaultBranch } = parseArgs();
  if (action !== 'merged-update') {
    console.error('Supported action: merged-update');
    process.exit(1);
  }

  // Single branch for merged baseline: bot/cs3d-merged. Workflow will create it from default if missing.
  const branch = MERGED_BRANCH;
  const exists = branchExists(branch);

  if (process.env.GITHUB_OUTPUT) {
    await fs.appendFile(process.env.GITHUB_OUTPUT, `branch=${branch}\n`);
    await fs.appendFile(process.env.GITHUB_OUTPUT, `branch_exists=${exists}\n`);
  }
  console.log(branch);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
