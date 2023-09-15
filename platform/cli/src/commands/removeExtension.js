import chalk from 'chalk';
import Listr from 'listr';

import {
  uninstallNPMPackage,
  throwIfExtensionUsedByInstalledMode,
  removeExtensionFromConfig,
  validateExtensionYarnInfo,
} from './utils/index.js';

export default async function removeExtension(packageName) {
  console.log(chalk.green.bold(`Removing ohif-extension ${packageName}...`));

  const tasks = new Listr(
    [
      {
        title: `Searching for installed extension: ${packageName}`,
        task: async () => await validateExtensionYarnInfo(packageName),
      },
      {
        title: `Checking if ${packageName} is in use by an installed mode`,
        task: async () => await throwIfExtensionUsedByInstalledMode(packageName),
      },
      {
        title: `Uninstalling npm package: ${packageName}`,
        task: async () => await uninstallNPMPackage(packageName),
      },
      {
        title: 'Removing ohif-extension from the configuration file',
        task: async () => removeExtensionFromConfig(packageName),
      },
    ],
    {
      exitOnError: true,
    }
  );

  await tasks
    .run()
    .then(() => {
      console.log(`${chalk.green.bold(`Removed ohif-extension ${packageName}`)} `);
    })
    .catch(error => {
      console.log(error.message);
    });
}
