#!/usr/bin/env node

import { Command } from 'commander';
import inquirer from 'inquirer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { getPathQuestions, getRepoQuestions } from './questions.js';
import {
  createPackage,
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
import chalk from 'chalk';

const runningDirectory = process.cwd();
const viewerDirectory = path.resolve(runningDirectory, 'platform/app');
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const packageJsonPath = path.join(runningDirectory, 'package.json');

try {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  if (packageJson.name !== 'ohif-monorepo-root') {
    console.log(packageJson);
    console.log(chalk.red('ohif-cli must run from the root of the OHIF platform'));
    process.exit(1);
  }
} catch (error) {
  console.log(chalk.red('ohif-cli must run from the root of the OHIF platform'));
  process.exit(1);
}

function _createPackage(packageType) {
  const pathQuestions = getPathQuestions(packageType);
  const repoQuestions = getRepoQuestions(packageType);

  let pathAnswers;

  const askPathQuestions = () => {
    inquirer.prompt(pathQuestions).then(answers => {
      pathAnswers = answers;
      if (pathAnswers.confirm) {
        askRepoQuestions(answers.baseDir, answers.name);
      } else {
        askPathQuestions();
      }
    });
  };

  const askRepoQuestions = () => {
    inquirer.prompt(repoQuestions).then(repoAnswers => {
      const answers = {
        ...pathAnswers,
        ...repoAnswers,
      };

      const templateDir = path.join(__dirname, `../templates/${packageType}`);
      answers.templateDir = templateDir;
      answers.targetDir = path.join(answers.baseDir);
      answers.packageType = packageType;

      createPackage(answers);
    });
  };

  askPathQuestions();
}

// for now ohif-cli is ran through yarn only.
// see ohif-cli.md section # OHIF Command Line Interface for reference.
const program = new Command('yarn run cli');
// Todo: inject with webpack
program
  .version('2.0.7')
  .description('OHIF CLI')
  .configureHelp({ sortOptions: true, sortSubcommands: true })
  .showHelpAfterError('(add --help for additional information)');

program
  .command('create-extension')
  .description('Create a new template Extension')
  .action(() => {
    _createPackage('extension');
  });

program
  .command('create-mode')
  .description('Create a new template Mode')
  .action(() => {
    _createPackage('mode');
  });

program
  .command('add-extension <packageName> [version]')
  .description('Adds an OHIF Extension')
  .action((packageName, version) => {
    // change directory to viewer
    process.chdir(viewerDirectory);
    addExtension(packageName, version);
  });

program
  .command('remove-extension <packageName>')
  .description('Removes an OHIF Extension')
  .action(packageName => {
    // change directory to viewer
    process.chdir(viewerDirectory);
    removeExtension(packageName);
  });

program
  .command('add-mode <packageName> [version]')
  .description('Add an OHIF Mode')
  .action((packageName, version) => {
    // change directory to viewer
    process.chdir(viewerDirectory);
    addMode(packageName, version);
  });

program
  .command('remove-mode <packageName>')
  .description('Removes an OHIF Mode')
  .action(packageName => {
    // change directory to viewer
    process.chdir(viewerDirectory);
    removeMode(packageName);
  });

program
  .command('link-extension <packageDir>')
  .description('Links a local OHIF Extension to the Viewer to be used for development')
  .action(packageDir => {
    if (!fs.existsSync(packageDir)) {
      console.log(
        chalk.red('The Extension directory does not exist, please provide a valid directory')
      );
      process.exit(1);
    }
    linkExtension(packageDir, { viewerDirectory });
  });

program
  .command('unlink-extension <extensionName>')
  .description('Unlinks a local OHIF Extension from the Viewer')
  .action(extensionName => {
    unlinkExtension(extensionName, { viewerDirectory });
    console.log(
      chalk.green(
        `Successfully unlinked Extension ${extensionName} from the Viewer, don't forget to run yarn install --force`
      )
    );
  });

program
  .command('link-mode <packageDir>')
  .description('Links a local OHIF Mode to the Viewer to be used for development')
  .action(packageDir => {
    if (!fs.existsSync(packageDir)) {
      console.log(chalk.red('The Mode directory does not exist, please provide a valid directory'));
      process.exit(1);
    }
    linkMode(packageDir, { viewerDirectory });
  });

program
  .command('unlink-mode <modeName>')
  .description('Unlinks a local OHIF Mode from the Viewer')
  .action(modeName => {
    unlinkMode(modeName, { viewerDirectory });
    console.log(
      chalk.green(
        `Successfully unlinked Mode ${modeName} from the Viewer, don't forget to run yarn install --force`
      )
    );
  });

program
  .command('list')
  .description('List Added Extensions and Modes')
  .action(() => {
    const configPath = path.resolve(viewerDirectory, './pluginConfig.json');
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
