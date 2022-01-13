import Listr from 'listr';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { copyTemplate, editPackageJson } from '../lib';
/**
 * Options include
 * - name
 * - version
 * - initialize git
 * - install dependencies
 * - description
 * - author
 * - license
 * @param {*} param0
 */

const validateOptions = options => {
  const { name, version, description, author, license } = options;

  if (!name) {
    throw new Error('Missing name');
  }

  return true;
};

const copyExtensionTemplate = async options => {
  const { name, version, description, author, license } = options;

  const currentFileUrl = import.meta.url;
  const targetDir = path.resolve(process.cwd(), options.name);

  const templateDir = path.resolve(
    fileURLToPath(currentFileUrl),
    '../../../templates/extension'
  );

  return await copyTemplate(templateDir, targetDir);
};

const createExtension = async options => {
  const targetDir = path.resolve(process.cwd(), options.name);

  const tasks = new Listr(
    [
      {
        title: 'Validating options',
        task: () => validateOptions(options),
      },
      {
        title: 'Copy template files',
        task: () => copyExtensionTemplate(options),
      },
      {
        title: 'Editing Package.json with provided information',
        task: () => editPackageJson(targetDir, options),
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
