import Listr from 'listr';
import chalk from 'chalk';
import fs from 'fs';

import {
  createDirectoryContents,
  editPackageJson,
  createLicense,
  createReadme,
  initGit,
} from './utils/index.js';

const createPackage = async options => {
  const { packageType } = options; // extension or mode

  if (fs.existsSync(options.targetDir)) {
    console.error(
      `%s ${packageType} with the same name already exists in this directory, either delete it or choose a different name`,
      chalk.red.bold('ERROR')
    );
    process.exit(1);
  }

  fs.mkdirSync(options.targetDir);

  const tasks = new Listr(
    [
      {
        title: 'Copying template files',
        task: () =>
          createDirectoryContents(options.templateDir, options.targetDir, options.prettier),
      },
      {
        title: 'Editing Package.json with provided information',
        task: () => editPackageJson(options),
      },
      {
        title: 'Creating a License file',
        task: () => createLicense(options),
      },
      {
        title: 'Creating a Readme file',
        task: () => createReadme(options),
      },
      {
        title: 'Initializing a Git Repository',
        enabled: () => options.gitRepository,
        task: () => initGit(options),
      },
    ],
    {
      exitOnError: true,
    }
  );

  await tasks.run();
  console.log();
  console.log(chalk.green(`Done: ${packageType} is ready at`, options.targetDir));
  console.log();

  console.log(chalk.green(`NOTE: In order to use this ${packageType} for development,`));
  console.log(chalk.green(`run the following command inside the root of the OHIF monorepo`));

  console.log();
  console.log(chalk.green.bold(`    yarn run cli link-${packageType} ${options.targetDir}`));
  console.log();
  console.log(
    chalk.yellow("and when you don't need it anymore, run the following command to unlink it")
  );
  console.log();
  console.log(chalk.yellow(`    yarn run cli unlink-${packageType} ${options.name}`));
  console.log();

  return true;
};

export default createPackage;
