import { validateExtension } from './validate.js';

export default async function findRequiredOhifExtensionsForMode(yarnInfo) {
  // Get yarn info file and get peer dependencies
  if (!yarnInfo.peerDependencies) {
    // No ohif-extension dependencies
    return;
  }

  const peerDependencies = yarnInfo.peerDependencies;
  const dependencies = [];
  const ohifExtensions = [];

  Object.keys(peerDependencies).forEach(packageName => {
    dependencies.push({
      packageName,
      version: peerDependencies[packageName],
    });
  });

  const promises = [];

  // Fetch each npm json and check which are ohif extensions
  for (let i = 0; i < dependencies.length; i++) {
    const dependency = dependencies[i];
    const { packageName, version } = dependency;
    const promise = validateExtension(packageName, version)
      .then(() => {
        ohifExtensions.push({ packageName, version });
      })
      .catch(() => {});

    promises.push(promise);
  }

  // Await all the extensions // TODO -> Improve so we async install each
  // extension and await all of those promises instead.
  await Promise.all(promises);

  return ohifExtensions;
}
