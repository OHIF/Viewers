import Listr from 'listr';
import chalk from 'chalk';

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

const validateOptions = (options) => {
  const { name, version, description, author, license } = options;

  if (!name) {
    throw new Error('Missing name');
  }

  return true;
};

const createExtension = async (options) => {
  // console.log(`Creating extension ${name}`);
  // console.log(`Version: ${version}`);
  // console.log(`Description: ${description}`);
  // console.log(`Author: ${author}`);
  // console.log(`License: ${license}`);
  debugger;
  const tasks = new Listr(
    [
      {
        title: 'Validating options',
        task: () => validateOptions(options),
      },
      {
        title: 'Copy project files',
        task: () => {},
      },
    ],
    {
      exitOnError: false,
    }
  );

  await tasks.run();
  console.log('%s Extension is ready', chalk.green.bold('DONE'));
  return true;
};

export { createExtension };
