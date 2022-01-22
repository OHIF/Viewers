import chalk from 'chalk';
import { execa } from 'execa';

export default async function validateYarn() {
  try {
    await execa('yarn', ['--version']);
  } catch (err) {
    console.log(
      '%s Yarn is not installed, please install it before linking your extension',
      chalk.red.bold('ERROR')
    );
    process.exit(1);
  }
}
