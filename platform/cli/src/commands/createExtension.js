import Listr from 'listr';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import {
  createDirectoryContents,
  editPackageJson,
  validateOptions,
  createLicense,
  createReadme,
} from '../lib.js';

const createExtension = async options => {
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
  console.log('%s Extension is ready', chalk.green.bold('DONE'));
  return true;
};

export { createExtension };
