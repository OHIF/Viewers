import program from 'commander';
import { prompt } from 'inquirer';
import QUESTIONS from './questions';

import { createExtension } from './commands';

export function cli(argv) {
  program.version('0.0.1').description('OHIF CLI');

  // For debugging
  program
    .command('create-extension <name>')
    .description('Create a new extension')
    .action((name) => {
      createExtension({ name });
    });

  // program
  //   .command('create-extension')
  //   .description('Create a new extension')
  //   .action((name) => {
  //     prompt(QUESTIONS.createExtension).then((answers) => {
  //       createExtension(answers);
  //     });
  //   });

  program.parse(process.argv);
}
