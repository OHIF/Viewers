import Listr from 'listr';
import chalk from 'chalk';
import removeExtension from './removeExtension.js';

export default async function removeExtensions(ohifExtensionsToRemove) {
  // Auto generate Listr tasks...
  const taskEntries = [];

  ohifExtensionsToRemove.forEach(packageName => {
    const title = `Removing ohif-extension ${packageName}`;

    taskEntries.push({
      title,
      task: async () => await removeExtension(packageName),
    });
  });

  const tasks = new Listr(taskEntries, {
    exitOnError: true,
  });

  await tasks
    .run()
    .then(() => {
      let extensonsString = '';

      ohifExtensionsToRemove.forEach(packageName => {
        extensonsString += ` ${packageName}`;
      });

      console.log(`${chalk.green.bold(`Extensions removed:${extensonsString}`)} `);
    })
    .catch(error => {
      console.log(error.message);
    });
}
