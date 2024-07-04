import { execa } from 'execa';
import fs from 'fs';
import path from 'path';
import { validateYarn, removeExtensionFromConfig, removeModeFromConfig } from './utils/index.js';

const linkPackage = async (packageName, options, removeFromConfig) => {
  const { viewerDirectory } = options;

  // make sure yarn is installed
  await validateYarn();

  // change directory to OHIF Platform root and execute yarn link
  process.chdir(viewerDirectory);

  const results = await execa(`yarn`, ['unlink', packageName]);
  console.log(results.stdout);

  const webpackPwaPath = path.join(viewerDirectory, '.webpack', 'webpack.pwa.js');

  await removePathFromWebpackConfig(webpackPwaPath, packageName);

  //update the plugin.json file
  removeFromConfig(packageName);

  // run prettier on the webpack config
  await execa(`yarn`, ['prettier', '--write', webpackPwaPath]);
};

async function removePathFromWebpackConfig(webpackConfigPath, packageName) {
  const fileContent = await fs.promises.readFile(webpackConfigPath, 'utf8');

  const packageNameSubstring = `${packageName}/node_modules`;
  const pathResolveStart = 'path.resolve(';
  const closingParenthesis = ')';

  let startIndex = fileContent.indexOf(packageNameSubstring);

  if (startIndex === -1) {
    return;
  }

  // Find the start of the "path.resolve" line.
  startIndex = fileContent.lastIndexOf(pathResolveStart, startIndex);

  // Find the end of the line with the closing parenthesis.
  let endIndex = fileContent.indexOf(closingParenthesis, startIndex) + 1;

  // Check if there's a comma after the closing parenthesis and remove it as well.
  if (fileContent[endIndex] === ',') {
    endIndex++;
  }

  const modifiedFileContent = fileContent.slice(0, startIndex) + fileContent.slice(endIndex);

  await fs.promises.writeFile(webpackConfigPath, modifiedFileContent);
}

function unlinkExtension(extensionName, options) {
  linkPackage(extensionName, options, removeExtensionFromConfig);
}

function unlinkMode(modeName, options) {
  linkPackage(modeName, options, removeModeFromConfig);
}

export { unlinkExtension, unlinkMode };
