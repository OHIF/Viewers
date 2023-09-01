import Listr from 'listr';
import chalk from 'chalk';

import {
  installNPMPackage,
  getYarnInfo,
  validateExtension,
  getVersionedPackageName,
  addExtensionToConfig,
} from './utils/index.js';

export default async function addExtension(packageName, version) {
  console.log(chalk.green.bold(`Adding ohif-extension ${packageName}...`));

  const versionedPackageName = getVersionedPackageName(packageName, version);

  const tasks = new Listr(
    [
      {
        title: `Searching for extension: ${versionedPackageName}`,
        task: async () => await validateExtension(packageName, version),
      },
      {
        title: `Installing npm package: ${versionedPackageName}`,
        task: async () => await installNPMPackage(packageName, version),
      },
      {
        title: 'Adding ohif-extension to the configuration file',
        task: async ctx => {
          const yarnInfo = await getYarnInfo(packageName);

          addExtensionToConfig(packageName, yarnInfo);

          ctx.yarnInfo = yarnInfo;
        },
      },
    ],
    {
      exitOnError: true,
    }
  );

  await tasks
    .run()
    .then(ctx => {
      console.log(
        `${chalk.green.bold(`Added ohif-extension ${packageName}@${ctx.yarnInfo.version}`)} `
      );
    })
    .catch(error => {
      console.log(error.message);
    });
}
