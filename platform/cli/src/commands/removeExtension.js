import uninstallNPMPackage from './utils/uninstallNPMPackage.js';
import readPluginConfigFile from './utils/readPluginConfigFile.js';
import { removeExtensionFromConfig } from './utils/manipulatePluginConfigFile.js';
import writePluginConfig from './utils/writePluginConfig.js';
import { validateExtensionYarnInfo } from './utils/validate.js';
import chalk from 'chalk';
import Listr from 'listr';

export default async function removeExtension(packageName) {
  console.log(chalk.green.bold(`Removing ohif-extension ${packageName}...`));

  async function removeExtensionFromConfigFile() {
    const pluginConfig = readPluginConfigFile();

    // Note: if file is not found, nothing to remove.
    if (pluginConfig) {
      removeExtensionFromConfig(pluginConfig, { packageName });
      writePluginConfig(pluginConfig);
    }
  }

  const tasks = new Listr(
    [
      {
        title: `Searching for installed extension: ${packageName}`,
        task: async () => await validateExtensionYarnInfo(packageName),
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
