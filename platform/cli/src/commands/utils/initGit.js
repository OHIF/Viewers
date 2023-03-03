import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { execa } from 'execa';

const exists = promisify(fs.exists);

async function initGit(options) {
  const { targetDir } = options;
  const targetPath = path.join(targetDir, '.git');

  // Check if git is installed
  try {
    await execa('git', ['--version']);
  } catch (err) {
    console.error(
      '%s Git is not installed. Please install git and try again.',
      chalk.red.bold('ERROR')
    );
    process.exit(1);
  }

  if (!(await exists(targetPath))) {
    try {
      await execa('git', ['init'], { cwd: targetDir });
    } catch (err) {
      console.error('%s Failed to initialize git', chalk.red.bold('ERROR'));
      console.error(err);
      process.exit(1);
    }
  }
}

export default initGit;
