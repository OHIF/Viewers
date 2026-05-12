import { execa } from 'execa';
import fs from 'fs/promises';
import glob from 'glob';
import path from 'path';

async function run() {
  const { stdout: branchName } = await execa('git', ['rev-parse', '--abbrev-ref', 'HEAD']);
  console.log('Current branch:', branchName);
  const lernaJson = JSON.parse(await fs.readFile('lerna.json', 'utf-8'));

  // read the current version from ./version.txt
  const nextVersion = (await fs.readFile('./version.txt', 'utf-8')).trim();
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

  console.log('Setting the version using lerna...');

  // Stage all changes (version.json, peer dependency updates, .npmrc deletion)
  // before lerna runs so they're included in lerna's commit
  await execa('git', ['add', '-A']);

  // Run lerna version without pushing
  // lerna will update package.json files and create a commit
  await execa('npx', [
    'lerna',
    'version',
    nextVersion,
    '--yes',
    '--exact',
    '--force-publish',
    '--message',
    `chore(version): Update package versions to ${nextVersion} [skip ci]`,
    '--conventional-commits',
    '--create-release',
    'github',
    '--no-push',
  ]);

  // Stage any files that need to be included in the amended commit. Lerna commits the package.json
  // files it modifies, but may not include other files that were staged before it ran (like
  // version.json or .npmrc deletion). Since we're amending the commit to combine all version-related
  // changes into a single commit, we need to ensure these files are included.
  // 
  // Note: Peer dependency updates are already in the package.json files that lerna modified,
  // so they will be included in lerna's commit automatically.
  await execa('git', ['add', '-A']);

  // Amend the last commit to include all changes. The commit message is already set by lerna
  // (line 79) and is the same, so we use --no-edit to keep the existing message.
  // This combines the version.json commit and package version updates into one commit
  await execa('git', ['commit', '--amend', '--no-edit']);

  // Lerna created a local tag (e.g. v3.13.0-beta.7) pointing to the pre-amend commit.
  // Move the tag to the amended commit so the release tag matches what we push.
  const tagName = `v${nextVersion}`;
  await execa('git', ['tag', '-f', tagName]);

  console.log('Pushing changes...');
  
  // Note: Force push is not necessary here because:
  // 1. Lerna is called with --no-push, so the commit created by lerna is never pushed to remote
  // 2. We amend the commit locally before pushing, so it's a new commit from the remote's perspective
  // 3. This script runs on a single branch locally, so there's no history rewrite on the remote
  // A regular push is sufficient since we're pushing a commit that doesn't exist on the remote yet
  await execa('git', ['push', 'origin', branchName]);

  console.log('Pushing tag...');
  await execa('git', ['push', 'origin', tagName]);

  console.log('Version set using lerna');
}

run().catch(err => {
  console.error('Error encountered during version bump:', err);
  process.exit(1);
});
