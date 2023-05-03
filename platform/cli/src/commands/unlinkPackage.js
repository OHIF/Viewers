import { execa } from 'execa';
import fs from 'fs';
import path from 'path';
import {
  validateYarn,
  removeExtensionFromConfig,
  removeModeFromConfig,
} from './utils/index.js';

const linkPackage = async (packageName, options, removeFromConfig) => {
  const { viewerDirectory } = options;

  // make sure yarn is installed
  await validateYarn();

  // change directory to OHIF Platform root and execute yarn link
  process.chdir(viewerDirectory);

  const results = await execa(`yarn`, ['unlink', packageName]);
  console.log(results.stdout);

  const webpackPwaPath = path.join(
    viewerDirectory,
    '.webpack',
    'webpack.pwa.js'
  );

  await removePathFromWebpackConfig(webpackPwaPath, packageName);

  //update the plugin.json file
  removeFromConfig(packageName);

  // run prettier on the webpack config
  await execa(`yarn`, ['prettier', '--write', webpackPwaPath]);
};

async function removePathFromWebpackConfig(webpackConfigPath, packageName) {
  const fileContent = await fs.promises.readFile(webpackConfigPath, 'utf8');

  const regexPattern = new RegExp(
    `\\s*path\\.resolve\\(__dirname, '(?:.*${packageName}.*)'\\),?`,
    'g'
  );

  const modifiedFileContent = fileContent.replace(regexPattern, '');

  await fs.promises.writeFile(webpackConfigPath, modifiedFileContent);
}

function unlinkExtension(extensionName, options) {
  linkPackage(extensionName, options, removeExtensionFromConfig);
}

function unlinkMode(modeName, options) {
  linkPackage(modeName, options, removeModeFromConfig);
}

export { unlinkExtension, unlinkMode };
