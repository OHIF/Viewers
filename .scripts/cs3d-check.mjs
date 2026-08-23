import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const workflowPath = path.resolve(
  process.cwd(),
  'libs',
  '@cornerstonejs',
  '.github',
  'workflows',
  'ohif-downstream.yml'
);

if (!fs.existsSync(workflowPath)) {
  console.error(`[cs3d:check] Workflow file not found: ${workflowPath}`);
  process.exit(1);
}

const workflowText = fs.readFileSync(workflowPath, 'utf8');
const ohifRefMatch = workflowText.match(/^\s*OHIF_REF:\s*["']?([^"'\r\n]+)["']?\s*$/m);

if (!ohifRefMatch) {
  console.error('[cs3d:check] Could not find OHIF_REF in ohif-downstream workflow.');
  process.exit(1);
}

const expectedBranch = ohifRefMatch[1].trim();
let currentBranch = '';

try {
  currentBranch = execSync('git rev-parse --abbrev-ref HEAD', {
    cwd: process.cwd(),
    encoding: 'utf8',
  }).trim();
} catch (error) {
  console.error('[cs3d:check] Failed to determine current git branch.');
  process.exit(1);
}

if (currentBranch !== expectedBranch) {
  console.error(
    `[cs3d:check] Branch mismatch: current='${currentBranch}', expected='${expectedBranch}' from ${path.relative(
      process.cwd(),
      workflowPath
    )}`
  );
  process.exit(1);
}

console.log(
  `[cs3d:check] OK: current branch '${currentBranch}' matches OHIF_REF in ${path.relative(
    process.cwd(),
    workflowPath
  )}`
);
