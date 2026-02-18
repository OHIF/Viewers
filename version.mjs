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

  // Check if this is a master branch (master or \d*.\d* like 3.13, 3.14)
  // Note vXXX are tags, not branches
  const isMasterBranch = branchName === 'master' || /^\d+\.\d+$/.test(branchName);

  let nextVersion;

  if (branchName.startsWith('release')) {
    console.log('Branch: release');
    await fs.writeFile('./commit.txt', currentCommitHash);
    const version = await fs.readFile('./version.txt', 'utf-8');
    nextVersion = version.trim();
    console.log('Version from version.txt:', nextVersion);
  } else if (isMasterBranch) {
    console.log('Branch: master (or version branch like v3.13)');
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
  } else {
    // For feature/fix branches, include the branch name in the version
    console.log('Branch: feature/fix branch');
    const prereleaseComponents = semver.prerelease(currentVersion);

    // Sanitize branch name for use in version (replace invalid chars with dashes)
    const sanitizedBranchName = branchName.replace(/[^a-zA-Z0-9-]/g, '-');

    if (prereleaseComponents?.includes('beta')) {
      // If current version has beta, keep it and append branch name
      // e.g., from 3.13.0-beta.8 to 3.13.0-beta.8-fix-corrected-version-number
      console.log(
        `Adding branch name to beta version, e.g., from ${currentVersion} to ${currentVersion}-${sanitizedBranchName}`
      );
      nextVersion = `${currentVersion}-${sanitizedBranchName}`;
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

  // Also write to platform/app for webpack to read
  await fs.writeFile('./platform/app/version.txt', versionInfo.version);
  await fs.writeFile('./platform/app/commit.txt', versionInfo.commit);

  console.log('Version info saved to version.json and platform/app');
}

run().catch(err => {
  console.error('Error encountered during new version & commit write:', err);
  process.exit(1);
});
