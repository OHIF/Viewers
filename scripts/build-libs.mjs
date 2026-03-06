/**
 * build:libs - Build libs (e.g. @cornerstonejs worktree) when present.
 * Runs build:cs3d if libs/@cornerstonejs exists, then link-cornerstone-libs
 * so node_modules/@cornerstonejs/* point at the built packages (no file: resolutions needed).
 */

import { execa } from 'execa';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const CS3D_LIBS_DIR = path.join(ROOT_DIR, 'libs', '@cornerstonejs');

async function main() {
  const present = await fs.access(CS3D_LIBS_DIR).then(
    () => true,
    () => false
  );
  if (!present) {
    console.log('build:libs: libs/@cornerstonejs not present, skipping.');
    return;
  }
  console.log('build:libs: building @cornerstonejs...');
  // Use yarn in libs so Netlify/CI can build without bun
  const libsCwd = CS3D_LIBS_DIR;
  await execa('yarn', ['install'], { cwd: libsCwd, stdio: 'inherit' });
  await execa('yarn', ['run', 'build'], { cwd: libsCwd, stdio: 'inherit' });
  console.log('build:libs: linking node_modules/@cornerstonejs to libs...');
  await execa('node', ['scripts/link-cornerstone-libs.mjs'], { cwd: ROOT_DIR, stdio: 'inherit' });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
