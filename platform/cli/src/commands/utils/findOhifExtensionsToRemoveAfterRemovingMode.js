import { readPluginConfigFile } from './private/index.js';
import getYarnInfo from './getYarnInfo.js';

export default async function findOhifExtensionsToRemoveAfterRemovingMode(removedModeYarnInfo) {
  const pluginConfig = readPluginConfigFile();

  if (!pluginConfig) {
    // No other modes or extensions, no action item.
    return [];
  }

  const { modes, extensions } = pluginConfig;

  const registeredExtensions = extensions.map(extension => extension.packageName);
  // TODO this is not a function
  const ohifExtensionsOfMode = Object.keys(removedModeYarnInfo.peerDependencies).filter(
    peerDependency => registeredExtensions.includes(peerDependency)
  );

  const ohifExtensionsUsedInOtherModes = ohifExtensionsOfMode.map(packageName => {
    return {
      packageName,
      used: false,
    };
  });

  // Check if other modes use each extension used by this mode
  const otherModes = modes.filter(mode => mode.packageName !== removedModeYarnInfo.name);

  for (let i = 0; i < otherModes.length; i++) {
    const mode = otherModes[i];
    const yarnInfo = await getYarnInfo(mode.packageName);

    const peerDependencies = yarnInfo.peerDependencies;

    if (!peerDependencies) {
      continue;
    }

    for (let j = 0; j < ohifExtensionsUsedInOtherModes.length; j++) {
      const ohifExtension = ohifExtensionsUsedInOtherModes[j];
      if (ohifExtension.used) {
        // Already accounted that we can't delete this, so don't waste effort
        return;
      }

      if (Object.keys(peerDependencies).includes(ohifExtension.packageName)) {
        ohifExtension.used = true;
      }
    }
  }

  // Return list of now unused extensions
  const ohifExtensionsToRemove = ohifExtensionsUsedInOtherModes
    .filter(ohifExtension => !ohifExtension.used)
    .map(ohifExtension => ohifExtension.packageName);

  return ohifExtensionsToRemove;
}
