#!/usr/bin/env node

import program from 'commander';
import inquirer from 'inquirer';
import path from 'path';
import { fileURLToPath } from 'url';

import QUESTIONS from './questions.js';
import { createExtension } from './commands/createExtension.js';
import { createMode } from './commands/createMode.js';

const currentDirectory = process.cwd();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
      const targetDir = path.join(currentDirectory, answers.name);
      const options = {
        ...answers,
        targetDir,
        templateDir,
      };
      createExtension(options);
    });
  });

program
  .command('create-mode')
  .description('Create a new Mode')
  .action(name => {
    inquirer.prompt(QUESTIONS.createMode).then(answers => {
      const templateDir = path.join(__dirname, '../templates/mode');
      const targetDir = path.join(currentDirectory, answers.name);
      const options = {
        ...answers,
        targetDir,
        templateDir,
      };
      createMode(options);
    });
  });

program.parse(process.argv);
