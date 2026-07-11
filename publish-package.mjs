import { execa } from 'execa';
import fs from 'fs/promises';
import glob from 'glob';
import path from 'path';

const MAX_RETRIES = 3;
const RETRY_DELAY = 10000; // 10 seconds

async function run() {
  const { stdout: branchName } = await execa('git', ['rev-parse', '--abbrev-ref', 'HEAD']);

  // Tiered publish surface (B6): only the published SDK packages -- the
  // @ohif/* contract surface third-party plugin authors compile and run
  // against (the @ohif/* members of the host shared-singleton set) -- plus
  // tooling are published to npm. App-only extensions/modes/platform packages
  // are private:true and are consumed via the git checkout / workspace
  // template instead. Note the asymmetry with publish-version.mjs, which
  // deliberately keeps stamping EVERY workspace package (private ones
  // included) so lockstep versioning is preserved; only the publish set is
  // narrowed here. This list must stay equal to SDK_PUBLISHED in
  // scripts/verify-tarballs.mjs, whose checkPublishListParity parses this
  // array (in CI, before this script runs) and fails the build when the two
  // lists drift in either direction.
  const packages = [
    'platform/core',
    'platform/i18n',
    'platform/ui-next',
    'extensions/default',
    'extensions/cornerstone',
    // @ohif/app: publish status flagged-not-decided (B6) -- its npm tarball
    // may be consumed as a prebuilt-viewer artifact by existing deployments,
    // so keep publishing it unchanged until that is verified.
    'platform/app',
    // create-ohif scaffolder (WS6): does not exist yet. Listed now so its
    // later addition to the publish surface is this single entry; glob.sync
    // returns no match (and we skip) until the directory lands.
    'platform/create-ohif',
  ];

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
            // Use `pnpm publish` (not npm) so the workspace:* specifiers on our
            // internal @ohif/* deps are rewritten to the exact version in the
            // published tarball. npm would publish the literal "workspace:*",
            // which npm/yarn consumers cannot resolve. --no-git-checks because
            // the bump commit/tag is created in CI on a possibly-detached ref.
            // pnpm is also required because publishConfig field overrides
            // (main/module/types/exports) are a pnpm-only feature; npm publish
            // would ship the src-pointing dev manifest.
            const publishArgs = ['publish', '--no-git-checks'];

            if (branchName === 'master') {
              publishArgs.push('--tag', 'beta');
            }

            await execa('pnpm', publishArgs);
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
