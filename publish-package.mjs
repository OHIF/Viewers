import { execa } from 'execa';

async function run() {
  const { stdout: branchName } = await execa('git', ['rev-parse', '--abbrev-ref', 'HEAD']);

  // using the environment variable NPM_TOKEN, create a .npmrc file
  // and set the token to the value of the environment variable
  // Publishing each package, if on master/main branch publish beta versions
  // otherwise publish latest
  if (branchName === 'release') {
    await execa('npx', ['lerna', 'publish', 'from-package', '--no-verify-access', '--yes']);
  } else {
    await execa('npx', [
      'lerna',
      'publish',
      'from-package',
      '--no-verify-access',
      '--yes',
      '--dist-tag',
      'beta',
    ]);
  }

  console.log('Finished');
}

run().catch(err => {
  console.error('Error encountered during package publish:', err);
  process.exit(1);
});
