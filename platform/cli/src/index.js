#!/usr/bin/env node

import program from 'commander';
import inquirer from 'inquirer';
import path from 'path';
import { fileURLToPath } from 'url';

import QUESTIONS from './questions.js';
import {
  createExtension,
  createMode,
  addExtension,
  removeExtension,
  addMode,
  removeMode,
} from './commands/index.js';

const currentDirectory = process.cwd();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

function getOptionsFromAnswers(answers) {
  const targetDir = path.join(currentDirectory, answers.name);
  const gitRepository = answers.gitRepository.toLowerCase() === 'y';

  return {
    ...answers,
    targetDir,
    gitRepository,
  };
}

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
  .action(() => {
    inquirer.prompt(QUESTIONS.createExtension).then(answers => {
      const templateDir = path.join(__dirname, '../templates/extension');
      const options = getOptionsFromAnswers(answers);

      options.templateDir = templateDir;

      createExtension(options);
    });
  });

program
  .command('create-mode')
  .description('Create a new Mode')
  .action(name => {
    inquirer.prompt(QUESTIONS.createMode).then(answers => {
      const templateDir = path.join(__dirname, '../templates/mode');
      const options = getOptionsFromAnswers(answers);

      options.templateDir = templateDir;
      createMode(options);
    });
  });

program
  .command('add-extension <packageName> [version]')
  .description('Adds an ohif extension')
  .action((packageName, version) => {
    addExtension(packageName, version);
  });

program
  .command('remove-extension <packageName>')
  .description('removes an ohif extension')
  .action(packageName => {
    removeExtension(packageName);
  });

program
  .command('add-mode <packageName> [version]')
  .description('Removes an ohif mode')
  .action((packageName, version) => {
    addMode(packageName, version);
  });

program
  .command('remove-mode <packageName>')
  .description('Removes an ohif mode')
  .action(packageName => {
    removeMode(packageName);
  });

program.parse(process.argv);
