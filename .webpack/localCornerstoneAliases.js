/**
 * When `libs/@cornerstonejs` is present (local CS3D checkout), map @cornerstonejs/*
 * to those package roots so webpack/rsbuild resolve without relying on symlinks
 * from `yarn cs3d:link` alone.
 *
 * Paths mirror scripts/link-ohif-cornerstone-node-modules.mjs (package name → folder).
 */
const path = require('path');
const fs = require('fs');

const PACKAGES = {
  adapters: 'packages/adapters',
  ai: 'packages/ai',
  core: 'packages/core',
  'dicom-image-loader': 'packages/dicomImageLoader',
  'labelmap-interpolation': 'packages/labelmap-interpolation',
  'nifti-volume-loader': 'packages/nifti-volume-loader',
  'polymorphic-segmentation': 'packages/polymorphic-segmentation',
  tools: 'packages/tools',
};

/**
 * @param {string} repoRoot Absolute path to OHIF repository root (parent of `libs/`)
 * @returns {Record<string, string>}
 */
function getLocalCornerstoneAliases(repoRoot) {
  const cs3dRoot = path.join(repoRoot, 'libs', '@cornerstonejs');
  const aliases = {};
  for (const [name, rel] of Object.entries(PACKAGES)) {
    const abs = path.join(cs3dRoot, rel);
    const pkgJson = path.join(abs, 'package.json');
    const distEsmIndex = path.join(abs, 'dist', 'esm', 'index.js');
    // Only alias when the package is built. Otherwise rspack/webpack match the alias
    // then fail on package.json "exports" (Cannot find module for matched aliased key).
    if (fs.existsSync(pkgJson) && fs.existsSync(distEsmIndex)) {
      // Exact match only (`$`): a prefix alias breaks subpath imports such as
      // `@cornerstonejs/tools/enums` — the bundler would resolve them under the package
      // root instead of via package.json "exports". Subpaths must resolve through
      // node_modules (e.g. after `yarn cs3d:link`) so exports apply; the main entry
      // still pins to this built dist tree.
      aliases[`@cornerstonejs/${name}$`] = distEsmIndex;
    }
  }
  return aliases;
}

module.exports = { getLocalCornerstoneAliases };
