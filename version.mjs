import { execa } from 'execa';
import semver from 'semver';
import fs from 'fs/promises';

async function run() {
  const { stdout: branchName } = await execa('git', ['rev-parse', '--abbrev-ref', 'HEAD']);
  console.log('Current branch:', branchName);

  // read the current version from lerna.json
  const lernaJson = JSON.parse(await fs.readFile('lerna.json', 'utf-8'));
  const currentVersion = lernaJson.version;

  console.log('Current version:', currentVersion);

  const { stdout: currentCommitHash } = await execa('git', ['rev-parse', 'HEAD']);
  console.log('Current commit hash:', currentCommitHash);

  const { stdout: lastCommitMessage } = await execa('git', ['log', '--format=%B', '-n', '1']);

  let nextVersion;

  if (branchName.startsWith('release')) {
    console.log('Branch: release');
    await fs.writeFile('./commit.txt', currentCommitHash);
    console.log('the version is automatically picked up from the version.txt file');
    return;
  } else {
    console.log('Branch: master');
    const prereleaseComponents = semver.prerelease(currentVersion);
    const isBumpBeta = lastCommitMessage.trim().includes('[BUMP BETA]');
    console.log('isBumpBeta', isBumpBeta);

    if (prereleaseComponents?.includes('beta')) {
      // if the version includes beta
      if (isBumpBeta) {
        // if the commit message includes [BUMP BETA]
        // which means that we should reset to beta 0 for next major version
        // e.g., from 2.11.0-beta.11 to 2.12.0-beta.0
        console.log(
          'Bumping beta version to be fresh beta, e.g., from 2.11.0-beta.11 to 2.12.0-beta.0'
        );
        nextVersion = `${semver.major(currentVersion)}.${
          semver.minor(currentVersion) + 1
        }.0-beta.0`;
      } else {
        // this means that the current version is already a beta version
        // and we should bump the beta version to the next beta version
        // e.g., from 2.11.0-beta.11 to 2.11.0-beta.12
        console.log(
          'Bumping beta version to be next beta, e.g., from 2.11.0-beta.11 to 2.11.0-beta.12'
        );
        nextVersion = semver.inc(currentVersion, 'prerelease', 'beta');
      }
    } else {
      // if the version does not include the beta, might be that a recent merge into the release branch
      // that later has been pulled into this PR
      console.log('Bumping beta version to be fresh beta e.g., from 2.11.0 to 2.12.0-beta.0');
      nextVersion = `${semver.major(currentVersion)}.${semver.minor(currentVersion) + 1}.0-beta.0`;
    }
  }

  if (!nextVersion) {
    throw new Error('Could not determine next version');
  }

  console.log('Next version:', nextVersion);
  console.log('Current commit hash:', currentCommitHash);

  const versionInfo = { version: nextVersion, commit: currentCommitHash };
  await fs.writeFile('./version.json', JSON.stringify(versionInfo, null, 2));
  await fs.writeFile('./version.txt', versionInfo.version);
  await fs.writeFile('./commit.txt', versionInfo.commit);

  console.log('Version info saved to version.json');
}

run().catch(err => {
  console.error('Error encountered during new version & commit write:', err);
  process.exit(1);
});
