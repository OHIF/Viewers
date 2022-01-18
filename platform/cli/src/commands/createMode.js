import Listr from 'listr';
import chalk from 'chalk';
import fs from 'fs';

import {
  createDirectoryContents,
  editPackageJson,
  validateOptions,
  createReadme,
  createLicense,
} from '../lib.js';

const createMode = async options => {
  fs.mkdirSync(options.targetDir);

  const tasks = new Listr(
    [
      {
        title: 'Validating options',
        task: () => validateOptions(options),
      },
      {
        title: 'Copy template files',
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
