/**
 * checkout-libs-for-netlify - Conditionally checkout libs from externals.json
 * for Netlify/CI. Reads libs/externals.json; if missing or exports empty, exits
 * successfully (no-op). Otherwise clones each listed repo at the given ref into
 * libs/<path>, then the rest of the build can run build:libs.
 *
 * externals.json shape:
 *   { "key": { "path": "@cornerstonejs", "url": "https://...", "branch"?: "name", "tag"?: "v1.0" } }
 * ref used for clone: branch || tag || ref || "main"
 */

import { execa } from 'execa';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const LIBS_DIR = path.join(ROOT_DIR, 'libs');
const EXTERNALS_PATH = path.join(ROOT_DIR, 'libs', 'externals.json');

async function main() {
  let externals;
  try {
    const raw = await fs.readFile(EXTERNALS_PATH, 'utf-8');
    externals = JSON.parse(raw);
  } catch (e) {
    console.log('checkout-libs: no libs/externals.json or invalid, skipping.');
    process.exit(0);
  }

  const entries = Object.entries(externals || {});
  if (entries.length === 0) {
    console.log('checkout-libs: exports empty, skipping.');
    process.exit(0);
  }

  await fs.mkdir(LIBS_DIR, { recursive: true });

  for (const [name, config] of entries) {
    const url = config.url;
    if (!url) {
      console.log(`checkout-libs: ${name} has no url, skipping.`);
      continue;
    }

    const ref = config.branch || config.tag || config.ref || 'main';
    const pathSeg = config.path || name;
    const targetDir = path.join(LIBS_DIR, pathSeg);

    try {
      await fs.access(targetDir);
      console.log(`checkout-libs: ${pathSeg} already present, skipping clone.`);
      continue;
    } catch {
      // targetDir does not exist, clone
    }

    console.log(`checkout-libs: cloning ${url} ref ${ref} into libs/${pathSeg}...`);
    await execa('git', ['clone', '--depth', '1', '--branch', ref, url, targetDir], {
      cwd: ROOT_DIR,
      stdio: 'inherit',
    });
  }

  console.log('checkout-libs: done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
