/**
 * worktree-cs3d: Create a git worktree of cornerstone3D in ./libs/@cornerstonejs
 * and set package.json resolutions for @cornerstonejs/* to use those local paths.
 *
 * Usage: node scripts/worktree-cs3d.mjs [-b new-branch] [branch] [cs3d-parent-dir]
 *   -b new-branch      Create a new branch from origin/main and use it for the worktree
 *   branch             Branch to checkout (default: origin/main); ignored if -b is used
 *   cs3d-parent-dir   Directory containing the cornerstone3D clone (default: ..)
 *                     Default clone name from `git clone https://github.com/cornerstonejs/cornerstone3D.git` is "cornerstone3D"
 */

import { execa } from 'execa';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');

const DEFAULT_BRANCH = 'origin/main';
const DEFAULT_CS3D_CLONE_DIR = 'cornerstone3D'; // name when cloning without a second argument

function parseArgs() {
  const argv = process.argv.slice(2);
  let createBranch = null;
  let branch = DEFAULT_BRANCH;
  let cs3dParentDir = '..';
  let i = 0;
  if (argv[i] === '-b') {
    createBranch = argv[i + 1];
    if (!createBranch) {
      console.error('Error: -b requires a branch name.');
      process.exit(1);
    }
    i += 2;
  }
  if (argv[i]) branch = argv[i++];
  if (argv[i]) cs3dParentDir = argv[i];
  return { createBranch, branch, cs3dParentDir };
}

async function main() {
  const { createBranch, branch, cs3dParentDir: cs3dParentArg } = parseArgs();
  const cs3dParentDir = path.resolve(ROOT_DIR, cs3dParentArg);
  const cs3dDir = path.join(cs3dParentDir, DEFAULT_CS3D_CLONE_DIR);
  const branchToUse = createBranch ?? branch;

  console.log('worktree:cs3d');
  if (createBranch) {
    console.log('  create branch:', createBranch, '(from origin/main)');
  } else {
    console.log('  branch:', branch);
  }
  console.log('  cs3d directory:', cs3dDir);

  const worktreePath = path.join(ROOT_DIR, 'libs', '@cornerstonejs');

  // Ensure cs3d clone exists and is a git repo
  try {
    await fs.access(path.join(cs3dDir, '.git'), fs.constants.R_OK);
  } catch (e) {
    console.error(
      `Error: Not a git repo at "${cs3dDir}". Clone with:\n  git clone https://github.com/cornerstonejs/cornerstone3D.git ${DEFAULT_CS3D_CLONE_DIR}\n(in the directory "${cs3dParentDir}")`
    );
    process.exit(1);
  }

  const worktreeExists = await fs.access(worktreePath).then(
    () => true,
    () => false
  );

  if (!worktreeExists) {
    await fs.mkdir(path.join(ROOT_DIR, 'libs'), { recursive: true });
    const worktreePathAbs = path.resolve(worktreePath);
    console.log('  creating worktree at', worktreePathAbs);
    try {
      if (createBranch) {
        await execa(
          'git',
          ['worktree', 'add', '-b', createBranch, worktreePathAbs, DEFAULT_BRANCH],
          { cwd: cs3dDir }
        );
      } else {
        await execa('git', ['worktree', 'add', worktreePathAbs, branch], {
          cwd: cs3dDir,
        });
      }
    } catch (e) {
      console.error('git worktree add failed:', e.message);
      process.exit(1);
    }
  } else {
    console.log('  worktree already exists at', worktreePath);
  }

  const packagesDir = path.join(worktreePath, 'packages');
  let packageNameToDir;
  try {
    const entries = await fs.readdir(packagesDir, { withFileTypes: true });
    packageNameToDir = {};
    for (const ent of entries) {
      if (!ent.isDirectory()) continue;
      const pkgPath = path.join(packagesDir, ent.name, 'package.json');
      try {
        const pkg = JSON.parse(await fs.readFile(pkgPath, 'utf-8'));
        if (pkg.name && pkg.name.startsWith('@cornerstonejs/')) {
          packageNameToDir[pkg.name] = ent.name;
        }
      } catch {
        // ignore non-packages or invalid package.json
      }
    }
  } catch (e) {
    console.error('Could not read packages from worktree:', e.message);
    process.exit(1);
  }

  const packageJsonPath = path.join(ROOT_DIR, 'package.json');
  const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
  const resolutions = packageJson.resolutions || {};

  for (const [name, dirName] of Object.entries(packageNameToDir)) {
    const resolution = `file:./libs/@cornerstonejs/packages/${dirName}`;
    resolutions[name] = resolution;
  }
  packageJson.resolutions = resolutions;

  await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf-8');

  console.log('  updated resolutions for:', Object.keys(packageNameToDir).join(', '));

  // Add or update cornerstonejs in libs/externals.json (directory + branch)
  const libsDir = path.join(ROOT_DIR, 'libs');
  const externalsPath = path.join(libsDir, 'externals.json');
  let externals = {};
  try {
    externals = JSON.parse(await fs.readFile(externalsPath, 'utf-8'));
  } catch {
    // create new
  }
  externals.cornerstonejs = {
    path: '@cornerstonejs',
    branch: branchToUse,
    directory: DEFAULT_CS3D_CLONE_DIR,
  };
  await fs.mkdir(libsDir, { recursive: true });
  await fs.writeFile(externalsPath, JSON.stringify(externals, null, 2) + '\n', 'utf-8');
  console.log('  updated libs/externals.json');

  // Update lockfile so resolutions take effect
  console.log('  running install:update-lockfile...');
  await execa('yarn', ['run', 'install:update-lockfile'], {
    cwd: ROOT_DIR,
    stdio: 'inherit',
  });

  console.log('Done.');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
