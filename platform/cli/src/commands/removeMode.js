import Listr from 'listr';
import chalk from 'chalk';

import {
  uninstallNPMPackage,
  findOhifExtensionsToRemoveAfterRemovingMode,
  removeModeFromConfig,
  validateModeYarnInfo,
  getYarnInfo,
} from './utils/index.js';
import removeExtensions from './removeExtensions.js';

export default async function removeMode(packageName) {
  console.log(chalk.green.bold(`Removing ohif-mode ${packageName}...`));

  const tasks = new Listr(
    [
      {
        title: `Searching for installed mode: ${packageName}`,
        task: async ctx => {
          ctx.yarnInfo = await getYarnInfo(packageName);
          await validateModeYarnInfo(packageName);
        },
      },
      {
        title: `Uninstalling npm package: ${packageName}`,
        task: async () => await uninstallNPMPackage(packageName),
      },
      {
        title: 'Removing ohif-mode from the configuration file',
        task: async () => await removeModeFromConfig(packageName),
      },
      {
        title: 'Detecting extensions that can be removed...',
        task: async ctx => {
          ctx.ohifExtensionsToRemove = await findOhifExtensionsToRemoveAfterRemovingMode(
            ctx.yarnInfo
          );
        },
      },
    ],
    {
      exitOnError: true,
    }
  );

  await tasks
    .run()
    .then(async ctx => {
      // Remove extensions if they aren't used by any other mode.
      console.log(`${chalk.green.bold(`Removed ohif-mode ${packageName}`)} `);

      const ohifExtensionsToRemove = ctx.ohifExtensionsToRemove;

      if (ohifExtensionsToRemove.length) {
        console.log(
          `${chalk.green.bold(
            `Removing ${ohifExtensionsToRemove.length} extensions no longer used by any installed mode`
          )}`
        );

        await removeExtensions(ohifExtensionsToRemove);
      }
    })
    .catch(error => {
      console.log(error.message);
    });
}
