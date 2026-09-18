import chalk from 'chalk';
import { execa } from 'execa';

export default async function validatePnpm() {
  try {
    await execa('pnpm', ['--version']);
  } catch (err) {
    console.log(
      '%s pnpm is not installed, please install it before linking your extension',
      chalk.red.bold('ERROR')
    );
    process.exit(1);
  }
}
