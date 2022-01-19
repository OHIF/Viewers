import {
  removeExtensionFromConfigJson,
  removeModeFromConfigJson,
  writePluginConfigFile,
  readPluginConfigFile,
} from './private/index.js';

function removeFromAndOverwriteConfig(packageName, augmentConfigFunction) {
  const pluginConfig = readPluginConfigFile();

  // Note: if file is not found, nothing to remove.
  if (pluginConfig) {
    augmentConfigFunction(pluginConfig, { packageName });
    writePluginConfigFile(pluginConfig);
  }
}

function removeExtensionFromConfig(packageName) {
  removeFromAndOverwriteConfig(packageName, removeExtensionFromConfigJson);
}

function removeModeFromConfig(packageName) {
  removeFromAndOverwriteConfig(packageName, removeModeFromConfigJson);
}

export { removeExtensionFromConfig, removeModeFromConfig };
