import { execa } from 'execa';
import fs from 'fs/promises';
import glob from 'glob';
import path from 'path';

async function run() {
  const { stdout: branchName } = await execa('git', ['rev-parse', '--abbrev-ref', 'HEAD']);
  console.log('Current branch:', branchName);

  // read the current version from ./version.txt
  const nextVersion = (await fs.readFile('./version.txt', 'utf-8')).trim();
  const packages = ['extensions/*', 'platform/*', 'modes/*'];

  // For each package's package.json file, update:
  // 1. The package version
  // 2. Any @ohif/* peerDependencies to the next version
  // 3. Any @ohif/* dependencies to the next version

  for (const packagePathPattern of packages) {
    const matchingDirectories = glob.sync(packagePathPattern);

    for (const packageDirectory of matchingDirectories) {
      const packageJsonPath = path.join(packageDirectory, 'package.json');

      try {
        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));

        // Update the package version
        packageJson.version = nextVersion;

        // Update peerDependencies
        if (packageJson.peerDependencies) {
          for (const dep of Object.keys(packageJson.peerDependencies)) {
            if (dep.startsWith('@ohif/')) {
              packageJson.peerDependencies[dep] = nextVersion;
            }
          }
        }

        // Update dependencies
        if (packageJson.dependencies) {
          for (const dep of Object.keys(packageJson.dependencies)) {
            if (dep.startsWith('@ohif/')) {
              packageJson.dependencies[dep] = nextVersion;
            }
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

  // Update root package.json version
  const rootPackageJson = JSON.parse(await fs.readFile('package.json', 'utf-8'));
  rootPackageJson.version = nextVersion;
  await fs.writeFile('package.json', JSON.stringify(rootPackageJson, null, 2) + '\n');
  console.log('Updated root package.json');

  // remove the .npmrc to not accidentally publish to npm
  await fs.unlink('.npmrc').catch(() => {});
  await execa('rm', ['-f', '.npmrc']);

  console.log('Setting the version...');

  // Stage all changes
  await execa('git', ['add', '-A']);

  // Create the version commit
  const commitMessage = `chore(version): Update package versions to ${nextVersion} [skip ci]`;
  await execa('git', ['commit', '-m', commitMessage]);

  // Create the version tag
  const tagName = `v${nextVersion}`;
  await execa('git', ['tag', '-f', tagName]);

  console.log('Pushing changes...');
  await execa('git', ['push', 'origin', branchName]);

  console.log('Pushing tag...');
  await execa('git', ['push', 'origin', tagName]);

  console.log('Version set successfully');
}

run().catch(err => {
  console.error('Error encountered during version bump:', err);
  process.exit(1);
});
