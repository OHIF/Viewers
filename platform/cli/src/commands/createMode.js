import Listr from 'listr';
import chalk from 'chalk';
import fs from 'fs';

import {
  createDirectoryContents,
  editPackageJson,
  createLicense,
  createReadme,
  initGit,
  createIdAndVersion,
} from './utils/index.js';

const createMode = async options => {
  if (fs.existsSync(options.targetDir)) {
    console.error(
      '%s Mode with the same name already exists in this directory, either delete it or choose a different name',
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
          createDirectoryContents(options.templateDir, options.targetDir),
      },
      {
        title: 'Changing extension id to the provided name',
        task: () => createIdAndVersion(options),
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
  console.log(chalk.green('Done: Mode is ready at', options.targetDir));
  console.log();

  console.log(
    chalk.green.bold('NOTE: In order to use this mode for development,')
  );
  console.log(chalk.green.bold('run `ohif-cli link-mode <mode-dir>` inside'));
  console.log(chalk.green.bold('the root folder of your OHIF repo.'));
  return true;
};

export default createMode;
