import program from 'commander';
import { prompt } from 'inquirer';
import QUESTIONS from './questions';

import { createExtension, createMode } from './commands';

export function cli(argv) {
  program.version('0.0.1').description('OHIF CLI');

  // For debugging
  program
    .command('debug <name> <license>')
    .description('Create a new extension')
    .action((name, license) => {
      createExtension({ name, license });
    });

  program
    .command('create-extension')
    .description('Create a new extension')
    .action(name => {
      prompt(QUESTIONS.createExtension).then(answers => {
        createExtension(answers);
      });
    });

  program
    .command('create-mode')
    .description('Create a new Mode')
    .action(name => {
      prompt(QUESTIONS.createMode).then(answers => {
        createMode(answers);
      });
    });

  program.parse(process.argv);
}
