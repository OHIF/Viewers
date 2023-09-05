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

  if (branchName === 'release') {
    console.log('Branch: release');
    nextVersion = semver.inc(currentVersion, 'minor');
  } else {
    console.log('Branch: master/main');
    const prereleaseComponents = semver.prerelease(currentVersion);
    const isBumpBeta = lastCommitMessage.trim().endsWith('[BUMP BETA]');
    console.log('isBumpBeta', isBumpBeta);

    if (prereleaseComponents && prereleaseComponents.includes('beta') && !isBumpBeta) {
      nextVersion = semver.inc(currentVersion, 'prerelease', 'beta');
    } else if (isBumpBeta && prereleaseComponents.includes('beta')) {
      console.log('Bumping beta version to be fresh beta');
      nextVersion = `${semver.major(currentVersion)}.${semver.minor(currentVersion) + 1}.0-beta.0`;
    } else {
      console.log('Bumping minor version for beta release');
      const nextMinorVersion = semver.inc(currentVersion, 'minor');
      nextVersion = `${semver.major(nextMinorVersion)}.${semver.minor(nextMinorVersion)}.0-beta.0`;
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
