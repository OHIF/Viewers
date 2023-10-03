import { execa } from 'execa';
import fs from 'fs/promises';
import glob from 'glob';
import path from 'path';

async function run() {
  const { stdout: branchName } = await execa('git', ['rev-parse', '--abbrev-ref', 'HEAD']);
  console.log('Current branch:', branchName);
  const lernaJson = JSON.parse(await fs.readFile('lerna.json', 'utf-8'));

  // read the current version from ./version.txt
  const nextVersion = await fs.readFile('./version.txt', 'utf-8');
  const packages = lernaJson.packages;

  if (!packages) {
    throw new Error('Could not find packages in lerna.json');
  }

  // for each package's package.json file, see if there is a peerdependency,
  // and for each peer dependency see if it includes a package that
  // starts with @ohif/, if so update the version to the
  // next version since lerna will not handle this for us

  // Iterate over each package path pattern
  for (const packagePathPattern of packages) {
    // Use glob to find all matching directories
    const matchingDirectories = glob.sync(packagePathPattern);

    for (const packageDirectory of matchingDirectories) {
      const packageJsonPath = path.join(packageDirectory, 'package.json');

      try {
        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));

        // lerna will take care of updating the dependencies, but it does not
        // update the peerDependencies, so we need to do that manually
        for (const peerDependency of Object.keys(packageJson.peerDependencies)) {
          if (peerDependency.startsWith('@ohif/')) {
            packageJson.peerDependencies[peerDependency] = nextVersion;
          }
        }

        await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');

        console.log(`Updated ${packageJsonPath}`);
      } catch (err) {
        console.log("ERROR: Couldn't find package.json in", packageDirectory);
        continue;
      }
    }
  }

  // remove the .npmrc to not accidentally publish to npm
  await fs.unlink('.npmrc');

  // rm -f ./.npmrc again
  await execa('rm', ['-f', '.npmrc']);

  // Todo: Do we really need to run the build command here?
  // Maybe we need to hook the netlify deploy preview
  // await execa('yarn', ['run', 'build']);

  console.log('Committing and pushing changes...');
  await execa('git', ['add', '-A']);
  await execa('git', ['commit', '-m', 'chore(version): version.json [skip ci]']);
  await execa('git', ['push', 'origin', branchName]);

  console.log('Setting the version using lerna...');

  // add a message to the commit to indicate that the version was set using lerna
  await execa('npx', [
    'lerna',
    'version',
    nextVersion,
    '--yes',
    '--exact',
    '--force-publish',
    '--message',
    'chore(version): Update package versions [skip ci]',
    '--conventional-commits',
    '--create-release',
    'github',
  ]);

  console.log('Version set using lerna');
}

run().catch(err => {
  console.error('Error encountered during version bump:', err);
  process.exit(1);
});
