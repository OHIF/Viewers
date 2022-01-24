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
  listPlugins,
  searchPlugins,
  linkExtension,
  linkMode,
  unlinkExtension,
  unlinkMode,
} from './commands/index.js';

const currentDirectory = process.cwd();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const viewerDirectory = path.resolve(__dirname, '../../viewer');
process.chdir(viewerDirectory);

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

program.command('debug').action(() => {
  process.chdir(viewerDirectory);

  console.log('current dir', process.cwd());
});

program
  .command('create-extension')
  .description('Create a new template extension')
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
  .description('Create a new template Mode')
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

program
  .command('link-extension <packageDir>')
  .description(
    'Links a local OHIF extension to the Viewer to be used for development'
  )
  .action(packageDir => {
    linkExtension(packageDir, { viewerDirectory });
  });

program
  .command('unlink-extension <extensionName>')
  .description('Unlinks a local OHIF extension from the Viewer')
  .action(extensionName => {
    unlinkExtension(extensionName, { viewerDirectory });
  });

program
  .command('link-mode <packageDir>')
  .description(
    'Links a local OHIF mode to the Viewer to be used for development'
  )
  .action(packageDir => {
    linkMode(packageDir, { viewerDirectory });
  });

program
  .command('unlink-mode <extensionName>')
  .description('Unlinks a local OHIF mode from the Viewer')
  .action(modeName => {
    unlinkMode(modeName, { viewerDirectory });
  });

program
  .command('list')
  .description('List Added Extensions and Modes')
  .action(() => {
    const configPath = path.resolve(process.cwd(), './pluginConfig.json');
    listPlugins(configPath);
  });

program
  .command('search')
  .option('-v, --verbose', 'Verbose output')
  .description('Search NPM for the list of Modes and Extensions')
  .action(options => {
    searchPlugins(options);
  });

program.parse(process.argv);
