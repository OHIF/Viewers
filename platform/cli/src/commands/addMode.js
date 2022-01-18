import Listr from 'listr';
import chalk from 'chalk';

import installNPMPackage from './utils/installNPMPackage.js';
import getPackageVersion from './utils/getPackageVersion.js';
import readPluginConfigFile from './utils/readPluginConfigFile.js';
import { addModeToConfig } from './utils/manipulatePluginConfigFile.js';
import writePluginConfig from './utils/writePluginConfig.js';
import { validateMode } from './utils/validate.js';

// Validation -> We have the version from the yarn info.
// Fetch the json from the registry (check version, get latest if not specified).
// Need to check we are using the correct repository.
// Check if this is.
// - Check if the package is already installed and flag this.
// - TODO: Download and install the lib.
// - TODO: Validate .
// - If not correct, uninstall the package if it was not installed before.
// -- This prevents the user from deleting e.g. React by using ohif-cli install-mode react.

// async function findExtensionDependencies() {
//   // Check installed node modules and fetch file.
//   let importString = '';
//   if (packageName.includes('@')) {
//     const [scope, packageNameLessScope] = packageName.split('/');
//     importString = `../../../../node_modules/${scope}/${packageNameLessScope}/${extensionIndexURL}`;
//   } else {
//     importString = `../../../../node_modules/${packageName}/${extensionIndexURL}`;
//   }

// let extensionDependencies = [];

// // TODO -> DERIVE THIS FROM THE PACKAGE.JSON

// // TODO -> Actually installation seems to have broken for modes.
// const extensionIndexURL = 'dist/index.umd.js';

//   console.log('TODO... fetch the data');
//   //const mode = await import(importString);

//   const mode = await import(packageName);
//   extensionDependencies = mode.extensionDependencies;
//   for (let i = 0; i < extensionDependencies.length; i++) {
//     console.log(extensionDependencies[i]);
//   }
// }

export default async function addMode(packageName, version) {
  console.log(chalk.green.bold(`Adding ohif-mode ${packageName}...`));

  let installedVersion;

  async function addModeToConfigFile() {
    installedVersion = await getPackageVersion(packageName);
    const pluginConfig = readPluginConfigFile();

    if (!pluginConfig) {
      pluginConfig = {
        extensions: [],
        modes: [],
      };
    }

    addModeToConfig(pluginConfig, {
      packageName,
      version: installedVersion,
    });
    writePluginConfig(pluginConfig);
  }

  const packageNameAndVersion =
    version === undefined ? packageName : `${packageName}@${version}`;

  const tasks = new Listr(
    [
      {
        title: `Searching for mode: ${packageNameAndVersion}`,
        task: async () => await validateMode(packageName, version),
      },
      {
        title: `Installing npm package: ${packageNameAndVersion}`,
        task: async () => await installNPMPackage(packageName, version),
      },
      {
        title: 'Adding ohif-mode to the configuration file',
        task: addModeToConfigFile,
      },
    ],
    {
      exitOnError: true,
    }
  );

  // TODO parse mode and add extensions

  await tasks
    .run()
    .then(() => {
      console.log(
        `${chalk.green.bold(
          `Added ohif-mode ${packageName}@${installedVersion}`
        )} `
      );
    })
    .catch(error => {
      console.log(error.message);
    });
}
