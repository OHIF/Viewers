import Listr from 'listr';
import chalk from 'chalk';

import { validateModeYarnInfo } from './utils/validate.js';

import uninstallNPMPackage from './utils/uninstallNPMPackage.js';
import readPluginConfigFile from './utils/readPluginConfigFile.js';
import { removeModeFromConfig } from './utils/manipulatePluginConfigFile.js';
import writePluginConfig from './utils/writePluginConfig.js';

export default async function removeMode(packageName) {
  console.log(chalk.green.bold(`Removing ohif-mode ${packageName}...`));

  async function removeModeFromConfigFile() {
    installedVersion = await getPackageVersion(packageName);
    const pluginConfig = readPluginConfigFile();

    // Note: if file is not found, nothing to remove.
    if (pluginConfig) {
      removeModeFromConfig(pluginConfig, { packageName });
      writePluginConfig(pluginConfig);
    }
  }

  const tasks = new Listr(
    [
      {
        title: `Searching for installed mode: ${packageName}`,
        task: async () => await validateModeYarnInfo(packageName),
      },
      {
        title: `Uninstalling npm package: ${packageName}`,
        task: async () => await uninstallNPMPackage(packageName),
      },
      {
        title: 'Removing ohif-mode from the configuration file',
        task: removeModeFromConfigFile,
      },
    ],
    {
      exitOnError: true,
    }
  );

  // TODO - Remove extensions if they aren't used by any other mode??

  await tasks
    .run()
    .then(() => {
      console.log(`${chalk.green.bold(`Removed ohif-mode ${packageName}`)} `);
    })
    .catch(error => {
      console.log(error.message);
    });
}
