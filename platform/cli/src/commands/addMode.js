import Listr from 'listr';
import chalk from 'chalk';

import installNPMPackage from './utils/installNPMPackage.js';
import getPackageVersion from './utils/getPackageVersion.js';
import readPluginConfigFile from './utils/readPluginConfigFile.js';
import { addModeToConfig } from './utils/manipulatePluginConfigFile.js';
import writePluginConfig from './utils/writePluginConfig.js';

export default async function addMode(packageName, version) {
  console.log('Adding ohif mode...');
  console.log(
    '%s There is currently no validation that this npm package is an ohif-extension.',
    chalk.yellow.bold('Warning')
  );

  const tasks = new Listr(
    [
      {
        title: `Installing npm package: ${packageName}`,
        task: async () => await installNPMPackage(packageName, version),
      },
      {
        title: 'Adding Mode to the Config file',
        task: async () => {
          const installedVersion = await getPackageVersion(packageName);
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
        },
      },
    ],
    {
      exitOnError: true,
    }
  );

  await tasks.run();

  // TODO parse mode and add extensions
  console.log('%s Mode Added', chalk.green.bold('DONE'));
}
