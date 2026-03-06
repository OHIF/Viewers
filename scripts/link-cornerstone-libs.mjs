/**
 * link-cornerstone-libs - Replace node_modules/@cornerstonejs/* with symlinks
 * to libs/@cornerstonejs/packages/* so the app uses the local built libs
 * without file: resolutions. Run after building libs (e.g. as part of build:libs).
 *
 * Creates symlinks in:
 *   - ROOT/node_modules/@cornerstonejs/<pkg>
 *   - ROOT/platform/app/node_modules/@cornerstonejs/<pkg> (if that node_modules exists)
 *   - ROOT/platform/ui/node_modules/@cornerstonejs/<pkg> (if that node_modules exists)
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const CS3D_PACKAGES_DIR = path.join(ROOT_DIR, 'libs', '@cornerstonejs', 'packages');

/** Directory symlink type: 'junction' on Windows (no admin), 'dir' elsewhere */
const DIR_LINK_TYPE = process.platform === 'win32' ? 'junction' : 'dir';

async function getPackageNames() {
  const entries = await fs.readdir(CS3D_PACKAGES_DIR, { withFileTypes: true });
  const packages = [];
  for (const ent of entries) {
    if (!ent.isDirectory()) continue;
    const pkgPath = path.join(CS3D_PACKAGES_DIR, ent.name, 'package.json');
    try {
      const pkg = JSON.parse(await fs.readFile(pkgPath, 'utf-8'));
      if (pkg.name && pkg.name.startsWith('@cornerstonejs/')) {
        packages.push({
          name: pkg.name,
          scopeName: pkg.name.slice('@cornerstonejs/'.length),
          dirName: ent.name,
          absolutePath: path.join(CS3D_PACKAGES_DIR, ent.name),
        });
      }
    } catch {
      // no package.json or not a @cornerstonejs package
    }
  }
  return packages;
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function linkIntoNodeModules(nodeModulesRoot) {
  const scopeDir = path.join(nodeModulesRoot, '@cornerstonejs');
  try {
    await fs.access(nodeModulesRoot);
  } catch {
    return; // this node_modules doesn't exist, skip
  }
  await ensureDir(scopeDir);
  const packages = await getPackageNames();
  for (const pkg of packages) {
    const linkPath = path.join(scopeDir, pkg.scopeName);
    const targetPath = pkg.absolutePath;
    try {
      const stat = await fs.lstat(linkPath);
      if (stat.isSymbolicLink()) {
        const current = await fs.readlink(linkPath);
        if (path.resolve(current) === path.resolve(targetPath)) continue;
      }
      await fs.rm(linkPath, { recursive: true, force: true });
    } catch {
      // linkPath doesn't exist, ok
    }
    await fs.symlink(targetPath, linkPath, DIR_LINK_TYPE);
    console.log(`link-cornerstone-libs: ${pkg.name} -> ${targetPath}`);
  }
}

async function main() {
  const present = await fs.access(CS3D_PACKAGES_DIR).then(
    () => true,
    () => false
  );
  if (!present) {
    console.log('link-cornerstone-libs: libs/@cornerstonejs/packages not present, skipping.');
    return;
  }

  const roots = [
    path.join(ROOT_DIR, 'node_modules'),
    path.join(ROOT_DIR, 'platform', 'app', 'node_modules'),
    path.join(ROOT_DIR, 'platform', 'ui', 'node_modules'),
    path.join(ROOT_DIR, 'platform', 'core', 'node_modules'),
  ];

  for (const root of roots) {
    await linkIntoNodeModules(root);
  }
  console.log('link-cornerstone-libs: done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
