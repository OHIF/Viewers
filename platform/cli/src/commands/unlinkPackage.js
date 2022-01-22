import { execa } from 'execa';
import { validateYarn, removeExtensionFromConfig } from './utils/index.js';

const linkPackage = async (extensionName, options) => {
  const { viewerDirectory } = options;

  // make sure yarn is installed
  await validateYarn();

  // change directory to OHIF Platform root and execute yarn link
  process.chdir(viewerDirectory);

  const results = await execa(`yarn`, ['unlink', extensionName]);
  console.log(results.stdout);

  //update the plugin.json file
  removeExtensionFromConfig(extensionName);
};

export default linkPackage;
