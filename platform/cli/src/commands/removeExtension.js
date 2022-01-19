import chalk from 'chalk';
import Listr from 'listr';

import {
  uninstallNPMPackage,
  readPluginConfigFile,
  removeExtensionFromConfig,
  writePluginConfigFile,
  validateExtensionYarnInfo,
  getYarnInfo,
} from './utils/index.js';

export default async function removeExtension(packageName) {
  console.log(chalk.green.bold(`Removing ohif-extension ${packageName}...`));

  async function removeExtensionFromConfigFile() {
    const pluginConfig = readPluginConfigFile();

    // Note: if file is not found, nothing to remove.
    if (pluginConfig) {
      removeExtensionFromConfig(pluginConfig, { packageName });
      writePluginConfigFile(pluginConfig);
    }
  }

  async function throwIfPackageUsedByAMode(packageName) {
    const pluginConfig = readPluginConfigFile();

    if (!pluginConfig) {
      // No other modes, not in use
      return false;
    }

    const { modes } = pluginConfig;

    const modesUsingExtension = [];

    debugger;

    for (let i = 0; i < modes.length; i++) {
      const mode = modes[i];
      const modePackageName = mode.packageName;
      const yarnInfo = await getYarnInfo(modePackageName);

      const peerDependencies = yarnInfo.peerDependencies;

      if (!peerDependencies) {
        continue;
      }

      if (Object.keys(peerDependencies).includes(packageName)) {
        modesUsingExtension.push(modePackageName);
      }
    }

    if (modesUsingExtension.length > 0) {
      let modesString = '';

      modesUsingExtension.forEach(packageName => {
        modesString += ` ${packageName}`;
      });

      const error = new Error(
        `${chalk.yellow.red(
          'Error'
        )} ohif-extension ${packageName} used by installed modes:${modesString}`
      );

      throw error;
    }
  }

  const tasks = new Listr(
    [
      {
        title: `Searching for installed extension: ${packageName}`,
        task: async () => await validateExtensionYarnInfo(packageName),
      },
      {
        title: `Checking if ${packageName} is in use by an installed mode`,
        task: async () => await throwIfPackageUsedByAMode(packageName),
      },
      {
        title: `Uninstalling npm package: ${packageName}`,
        task: async () => await uninstallNPMPackage(packageName),
      },
      {
        title: 'Removing ohif-extension from the configuration file',
        task: removeExtensionFromConfigFile,
      },
    ],
    {
      exitOnError: true,
    }
  );

  // TODO -> Warn of extension removal when an extension is removed that a mode is using?

  await tasks
    .run()
    .then(() => {
      console.log(
        `${chalk.green.bold(`Removed ohif-extension ${packageName}`)} `
      );
    })
    .catch(error => {
      console.log(error.message);
    });
}
