import { execa } from 'execa';
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

  //update the plugin.json file
  removeFromConfig(packageName);
};

function unlinkExtension(extensionName, options) {
  linkPackage(extensionName, options, removeExtensionFromConfig);
}

function unlinkMode(modeName, options) {
  linkPackage(modeName, options, removeModeFromConfig);
}

export { unlinkExtension, unlinkMode };
