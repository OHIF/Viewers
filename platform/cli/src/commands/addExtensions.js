import Listr from 'listr';
import chalk from 'chalk';
import addExtension from './addExtension.js';

export default async function addExtensions(ohifExtensions) {
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

      ohifExtensions.forEach(({ packageName, version }) => {
        extensonsString += ` ${packageName}@${version}`;
      });

      console.log(`${chalk.green.bold(`Extensions added:${extensonsString}`)} `);
    })
    .catch(error => {
      console.log(error.message);
    });
}
