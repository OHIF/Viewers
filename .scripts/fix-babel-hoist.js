/**
 * Netlify (and other CI) caches node_modules. Yarn resolutions can hoist
 * @babel/plugin-transform-class-static-block@7.28.x while leaving a stale nested
 * @babel/helper-create-class-features-plugin@7.27.x under the plugin directory.
 * The plugin then resolves the old helper and fails with:
 *   buildNamedEvaluationVisitor is not a function
 */
const fs = require('fs');
const path = require('path');

const pluginDir = path.join(
  __dirname,
  '..',
  'node_modules',
  '@babel',
  'plugin-transform-class-static-block'
);

if (!fs.existsSync(pluginDir)) {
  process.exit(0);
}

const nestedBabelDir = path.join(pluginDir, 'node_modules', '@babel');
if (!fs.existsSync(nestedBabelDir)) {
  process.exit(0);
}

const nestedHelperPkg = path.join(
  nestedBabelDir,
  'helper-create-class-features-plugin',
  'package.json'
);

let shouldRemove = true;
if (fs.existsSync(nestedHelperPkg)) {
  const nestedVersion = JSON.parse(fs.readFileSync(nestedHelperPkg, 'utf8')).version;
  const pluginPkg = JSON.parse(
    fs.readFileSync(path.join(pluginDir, 'package.json'), 'utf8')
  );
  const requiredRange =
    pluginPkg.dependencies['@babel/helper-create-class-features-plugin'];
  const minRequired = requiredRange.replace(/^\^/, '');
  // Keep nested copy only when it satisfies the plugin's declared range.
  shouldRemove = nestedVersion.localeCompare(minRequired, undefined, {
    numeric: true,
  }) < 0;
}

if (shouldRemove) {
  fs.rmSync(nestedBabelDir, { recursive: true, force: true });
  console.log(
    'fix-babel-hoist: removed stale nested @babel packages under plugin-transform-class-static-block'
  );
}
