import { execa } from 'execa';
import fs from 'fs/promises';
import glob from 'glob';
import path from 'path';

const MAX_RETRIES = 3;
const RETRY_DELAY = 10000; // 10 seconds

async function run() {
  const { stdout: branchName } = await execa('git', ['rev-parse', '--abbrev-ref', 'HEAD']);

  const lernaJson = JSON.parse(await fs.readFile('lerna.json', 'utf8'));

  const packages = lernaJson.packages;

  const rootDir = process.cwd();

  for (const packagePathPattern of packages) {
    const matchingDirectories = glob.sync(packagePathPattern, { cwd: rootDir });

    for (const packageDirectory of matchingDirectories) {
      try {
        // change back to the root directory
        process.chdir(rootDir);

        const packageJsonPath = path.join(packageDirectory, 'package.json');

        const packageJsonContent = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));

        if (packageJsonContent.private) {
          console.log(`Skipping private package at ${packageDirectory}`);
          continue;
        }

        // move to package directory
        process.chdir(packageDirectory);

        let retries = 0;
        while (retries < MAX_RETRIES) {
          try {
            console.log(`Tying to publishing package at ${packageDirectory}`);
            const publishArgs = ['publish'];

            if (branchName === 'master') {
              publishArgs.push('--tag', 'beta');
            }

            await execa('npm', publishArgs);
            console.log(`Successfully published package at ${packageDirectory}`);
            break;
          } catch (error) {
            retries++;
            console.error(
              `Failed to publish package at ${packageDirectory} with error ${error}, retrying... (${retries}/${MAX_RETRIES})`
            );
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
          }
        }
      } catch (error) {
        console.error(`An error occurred while processing ${packageDirectory}: ${error}`);
      } finally {
        process.chdir(rootDir); // Ensure we always move back to the root directory
      }
    }
  }

  console.log('Finished');
}

run().catch(err => {
  console.error('Error encountered during package publish:', err);
  process.exit(1);
});
