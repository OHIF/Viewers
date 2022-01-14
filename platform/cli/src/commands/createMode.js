import Listr from 'listr';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import {
  createDirectoryContents,
  editPackageJson,
  validateOptions,
  initGit,
  createReadme,
  createLicense,
} from '../lib.js';

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
        title: 'Validating options',
        task: () => validateOptions(options),
      },
      {
        title: 'Copying template files',
        task: () =>
          createDirectoryContents(options.templateDir, options.targetDir),
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
  console.log('%s Mode is ready', chalk.green.bold('DONE'));
  return true;
};

export { createMode };
