import Listr from 'listr';
import chalk from 'chalk';

import installNPMPackage from './utils/installNPMPackage.js';
import readPluginConfigFile from './utils/readPluginConfigFile.js';
import getPackageVersion from './utils/getPackageVersion.js';
import { addExtensionToConfig } from './utils/manipulatePluginConfigFile.js';
import writePluginConfig from './utils/writePluginConfig.js';
import { validateExtension } from './utils/validate.js';

export default async function addExtension(packageName, version) {
  console.log(chalk.green.bold(`Adding ohif-extension ${packageName}...`));

  let installedVersion;

  async function addExtensionToConfigFile() {
    installedVersion = await getPackageVersion(packageName);
    const pluginConfig = readPluginConfigFile();

    if (!pluginConfig) {
      pluginConfig = {
        extensions: [],
        modes: [],
      };
    }

    addExtensionToConfig(pluginConfig, {
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
        title: `Searching for extension: ${packageNameAndVersion}`,
        task: async () => await validateExtension(packageName, version),
      },
      {
        title: `Installing npm package: ${packageNameAndVersion}`,
        task: async () => await installNPMPackage(packageName, version),
      },
      {
        title: 'Adding ohif-extension to the configuration file',
        task: addExtensionToConfigFile,
      },
      // { // TODO
      //   title: 'Finding extension dependencies',
      //   task: findExtensionDependencies,
      // },
    ],
    {
      exitOnError: true,
    }
  );

  await tasks
    .run()
    .then(() => {
      console.log(
        `${chalk.green.bold(
          `Added ohif-extension ${packageName}@${installedVersion}`
        )} `
      );
    })
    .catch(error => {
      console.log(error.message);
    });
}
