/**
 * install:libs - For each external in libs/externals.json, run install:frozen
 * and build in that lib directory (uses external/worktree versions of the libs).
 */

import { execa } from 'execa';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const EXTERNALS_PATH = path.join(ROOT_DIR, 'libs', 'externals.json');

async function main() {
  let externals;
  try {
    externals = JSON.parse(await fs.readFile(EXTERNALS_PATH, 'utf-8'));
  } catch (e) {
    console.log('install:libs: no libs/externals.json or invalid, skipping.');
    return;
  }

  const entries = Object.entries(externals);
  if (entries.length === 0) {
    console.log('install:libs: no externals listed, skipping.');
    return;
  }

  for (const [name, config] of entries) {
    const libPath = path.join(ROOT_DIR, 'libs', config.path || name);
    try {
      await fs.access(libPath);
    } catch {
      console.warn(`install:libs: ${name} path missing (${libPath}), skipping.`);
      continue;
    }

    console.log(`install:libs: ${name} at ${libPath}`);
    await execa('bun', ['install', '--frozen-lockfile'], {
      cwd: libPath,
      stdio: 'inherit',
    });
    await execa('bun', ['run', 'build'], {
      cwd: libPath,
      stdio: 'inherit',
    });
  }

  console.log('install:libs: done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
