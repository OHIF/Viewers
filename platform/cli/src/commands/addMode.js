import Listr from 'listr';
import chalk from 'chalk';

import {
  installNPMPackage,
  getYarnInfo,
  getVersionedPackageName,
  validateMode,
  addModeToConfig,
  findRequiredOhifExtensionsForMode,
} from './utils/index.js';
import addExtensions from './addExtensions.js';

export default async function addMode(packageName, version) {
  console.log(chalk.green.bold(`Adding ohif-mode ${packageName}...`));

  const versionedPackageName = getVersionedPackageName(packageName, version);

  const tasks = new Listr(
    [
      {
        title: `Searching for mode: ${versionedPackageName}`,
        task: async () => await validateMode(packageName, version),
      },
      {
        title: `Installing npm package: ${versionedPackageName}`,
        task: async () => await installNPMPackage(packageName, version),
      },
      {
        title: 'Adding ohif-mode to the configuration file',
        task: async ctx => {
          const yarnInfo = await getYarnInfo(packageName);

          addModeToConfig(packageName, yarnInfo);

          ctx.yarnInfo = yarnInfo;
        },
      },
      {
        title: 'Detecting required ohif-extensions...',
        task: async ctx => {
          ctx.ohifExtensions = await findRequiredOhifExtensionsForMode(ctx.yarnInfo);
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
      console.log(`${chalk.green.bold(`Added ohif-mode ${packageName}@${ctx.yarnInfo.version}`)} `);

      const ohifExtensions = ctx.ohifExtensions;

      if (ohifExtensions.length) {
        console.log(`${chalk.green.bold(`Installing dependent extensions`)} `);
        await addExtensions(ohifExtensions);
      }
    })
    .catch(error => {
      console.log(error.message);
    });
}
