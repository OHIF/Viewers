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
    const pluginConfig = readPluginConfigFile();

    // Note: if file is not found, nothing to remove.
    if (pluginConfig) {
      removeModeFromConfig(pluginConfig, { packageName });
      writePluginConfigFile(pluginConfig);
    }
  }

  async function findOhifExtensionsToRemove(yarnInfo) {
    const pluginConfig = readPluginConfigFile();

    if (!pluginConfig) {
      // No other modes
      return [];
    }

    const { modes, extensions } = pluginConfig;

    const registeredExtensions = extensions.map(
      extension => extension.packageName
    );

    // TODO this is not a function
    const ohifExtensionsOfMode = yarnInfo.peerDependencies.filter(
      peerDependency => registeredExtensions.includes(peerDependency)
    );

    const ohifExtensionsUsedInOtherModes = ohifExtensionsOfMode.map(
      packageName => {
        return {
          packageName,
          used: false,
        };
      }
    );

    // Check if other modes use each extension used by this mode
    const otherModes = modes.filter(mode.packageName !== yarnInfo.name);

    for (let i = 0; i < otherModes.length; i++) {
      const mode = modes[i];
      const yarnInfo = await getYarnInfo(mode);

      const peerDependencies = yarnInfo.peerDependencies;

      if (!peerDependencies) {
        continue;
      }

      for (let j = 0; j < ohifExtensionsUsedInOtherModes; j++) {
        const ohifExtension = ohifExtensionsUsedInOtherModes[j];
        if (ohifExtension.used) {
          // Already accounted that we can't delete this, so don't waste effort
          return;
        }

        if (peerDependencies.includes(ohifExtension.packageName)) {
          ohifExtension.used = true;
        }
      }
    }

    // Return list of now unused extensions
    const ohifExtensionsToRemove = ohifExtensionsUsedInOtherModes
      .filter(ohifExtension => !ohifExtension.used)
      .map(ohifExtension => ohifExtension.packageName);

    return ohifExtensionsToRemove;
  }

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
        task: removeModeFromConfigFile,
      },
      {
        title: 'Detecting extensions that can be removed...',
        task: async ctx => {
          ctx.ohifExtensions = await findOhifExtensionsToRemove(ctx.yarnInfo);
        },
      },
    ],
    {
      exitOnError: true,
    }
  );

  // TODO - Remove extensions if they aren't used by any other mode??

  await tasks
    .run()
    .then(ctx => {
      if (ctx.ohifExtensions && ctx.ohifExtensions.length) {
        console.log(
          `I have ${ctx.ohifExtensions.length} extensions to remove!!`
        );
      }
      console.log(`${chalk.green.bold(`Removed ohif-mode ${packageName}`)} `);
    })
    .catch(error => {
      console.log(error.message);
    });
}
