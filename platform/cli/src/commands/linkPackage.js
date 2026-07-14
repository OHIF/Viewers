import fs from 'fs';
import path from 'path';
import { execa } from 'execa';
import { keywords } from './enums/index.js';
import { validatePnpm, addExtensionToConfig, addModeToConfig } from './utils/index.js';

async function linkPackage(packageDir, options, addToConfig, keyword) {
  const { viewerDirectory } = options;

  // read package.json from packageDir
  const file = fs.readFileSync(path.join(packageDir, 'package.json'), 'utf8');

  // name of the package
  const packageJSON = JSON.parse(file);
  const packageName = packageJSON.name;
  const packageKeywords = packageJSON.keywords;

  // check if package is an extension or a mode
  if (!packageKeywords.includes(keyword)) {
    throw new Error(`${packageName} is not ${keyword}`);
  }

  const version = packageJSON.version;

  // make sure pnpm is installed
  await validatePnpm();

  // resolve the package directory before changing the working directory
  const resolvedPackageDir = path.resolve(packageDir);

  // change directory to the OHIF Platform root and link the local package there
  process.chdir(`${viewerDirectory}/../..`);

  let results = await execa('pnpm', ['link', resolvedPackageDir]);
  console.log(results.stdout);

  // Add the node_modules of the linked package so that webpack
  // can find the linked package externals if there are
  const webpackPwaPath = path.join(viewerDirectory, '.webpack', 'webpack.pwa.js');

  async function updateWebpackConfig(webpackConfigPath, packageDir) {
    const packageNodeModules = path.join(packageDir, 'node_modules');
    const fileContent = await fs.promises.readFile(webpackConfigPath, 'utf8');

    const newLine = `path.resolve(__dirname, '${packageNodeModules}'),`;
    const modifiedFileContent = fileContent.replace(
      /(modules:\s*\[)([\s\S]*?)(\])/,
      `$1$2  ${newLine.replace(/\\/g, '/')}$3`
    );

    await fs.promises.writeFile(webpackConfigPath, modifiedFileContent);
  }

  await updateWebpackConfig(webpackPwaPath, packageDir);

  // change directory to viewer packages and add the config item
  process.chdir(viewerDirectory);
  addToConfig(packageName, {
    version,
  });

  // run prettier on the webpack config
  results = await execa('pnpm', ['exec', 'prettier', '--write', webpackPwaPath]);
}

function linkExtension(packageDir, options) {
  const keyword = keywords.EXTENSION;
  linkPackage(packageDir, options, addExtensionToConfig, keyword);
}

function linkMode(packageDir, options) {
  const keyword = keywords.MODE;
  linkPackage(packageDir, options, addModeToConfig, keyword);
}

export { linkExtension, linkMode };
