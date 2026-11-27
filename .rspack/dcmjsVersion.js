const fs = require('fs');
const path = require('path');

/**
 * The version of the dcmjs copy that the WSI SR writer bundles.
 *
 * dcmjs has no runtime version export, and its `exports` map hides
 * package.json. So this resolves dcmjs from the directory of the writer, as
 * the bundler does, and walks up from the resolved file to the package.json
 * whose name is `dcmjs`.
 */
const writerDir = path.join(__dirname, '../extensions/dicom-microscopy/src/utils');
let dir = path.dirname(require.resolve('dcmjs', { paths: [writerDir] }));
let version;
while (!version) {
  const packageJson = path.join(dir, 'package.json');
  if (fs.existsSync(packageJson)) {
    const { name, version: found } = JSON.parse(fs.readFileSync(packageJson, 'utf8'));
    if (name === 'dcmjs') {
      version = found;
    }
  }
  const parent = path.dirname(dir);
  if (parent === dir) {
    throw new Error('dcmjsVersion: no dcmjs package.json above the resolved dcmjs file');
  }
  dir = parent;
}

module.exports = version;
