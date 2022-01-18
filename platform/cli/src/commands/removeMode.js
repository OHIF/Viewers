import Listr from 'listr';
import chalk from 'chalk';

import {
  uninstallNPMPackage,
  readPluginConfigFile,
  removeModeFromConfig,
  writePluginConfigFile,
  validateModeYarnInfo,
  getYarnInfo,
} from './utils/index.js';

export default async function removeMode(packageName) {
  console.log(chalk.green.bold(`Removing ohif-mode ${packageName}...`));

  async function removeModeFromConfigFile() {
    yarnInfo = await getYarnInfo(packageName);

    const pluginConfig = readPluginConfigFile();

    // Note: if file is not found, nothing to remove.
    if (pluginConfig) {
      removeModeFromConfig(pluginConfig, { packageName });
      writePluginConfigFile(pluginConfig);
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
