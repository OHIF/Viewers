import Listr from 'listr';
import chalk from 'chalk';

import {
  installNPMPackage,
  readPluginConfigFile,
  getYarnInfo,
  writePluginConfigFile,
  getVersionedPackageName,
  addModeToConfig,
  validateMode,
  validateExtension,
} from './utils/index.js';
import addExtension from './addExtension.js';

export default async function addMode(packageName, version) {
  console.log(chalk.green.bold(`Adding ohif-mode ${packageName}...`));

  async function getYarnInfoAndAddModeToConfigFile() {
    const yarnInfo = await getYarnInfo(packageName);

    const installedVersion = yarnInfo.version;
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
    writePluginConfigFile(pluginConfig);

    return yarnInfo;
  }

  async function findOhifExtensions(yarnInfo) {
    // Get yarn info file and get peer dependencies
    if (!yarnInfo.peerDependencies) {
      // No ohif-extension dependencies
      return;
    }

    const peerDependencies = yarnInfo.peerDependencies;
    const dependencies = []; // TODO -> Can probably skip this mapping step
    const ohifExtensions = [];

    Object.keys(peerDependencies).forEach(packageName => {
      dependencies.push({
        packageName,
        version: peerDependencies[packageName],
      });
    });

    const promises = [];

    // Fetch each npm json and check which are ohif extensions
    for (let i = 0; i < dependencies.length; i++) {
      const dependency = dependencies[i];
      const { packageName, version } = dependency;
      const promise = validateExtension(packageName, version)
        .then(() => {
          ohifExtensions.push({ packageName, version });
        })
        .catch(() => {});

      promises.push(promise);
    }

    // Await all the extensions // TODO -> Improve so we async install each
    // extension and await all of those promises instead.
    await Promise.all(promises);

    return ohifExtensions;
  }

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
          ctx.yarnInfo = await getYarnInfoAndAddModeToConfigFile();
        },
      },
      {
        title: 'Detecting required ohif-extensions...',
        task: async ctx => {
          ctx.ohifExtensions = await findOhifExtensions(ctx.yarnInfo);
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
      console.log(
        `${chalk.green.bold(
          `Added ohif-mode ${packageName}@${ctx.yarnInfo.version}`
        )} `
      );

      const ohifExtensions = ctx.ohifExtensions;

      if (ohifExtensions.length) {
        console.log(`${chalk.green.bold(`Installing dependent extensions`)} `);

        // Auto generate Listr tasks...

        const taskEntries = [];

        ohifExtensions.forEach(({ packageName, version }) => {
          const title = `Adding ohif-extension ${packageName}`;

          taskEntries.push({
            title,
            task: async () => await addExtension(packageName, version),
          });
        });

        const tasks = new Listr(taskEntries, {
          exitOnError: true,
        });

        await tasks
          .run()
          .then(() => {
            let extensonsString = '';

            ctx.ohifExtensions.forEach(({ packageName, version }) => {
              extensonsString += ` ${packageName}@${version}`;
            });

            console.log(
              `${chalk.green.bold(`Extensions added:${extensonsString}`)} `
            );
          })
          .catch(error => {
            console.log(error.message);
          });
      }
    })
    .catch(error => {
      console.log(error.message);
    });
}
