import {
  addExtensionToConfigJson,
  addModeToConfigJson,
  readPluginConfigFile,
  writePluginConfigFile,
} from './private/index.js';

function addToAndOverwriteConfig(packageName, yarnInfo, augmentConfigFuntion) {
  const installedVersion = yarnInfo.version;
  const pluginConfig = readPluginConfigFile();

  if (!pluginConfig) {
    pluginConfig = {
      extensions: [],
      modes: [],
    };
  }

  augmentConfigFuntion(pluginConfig, {
    packageName,
    version: installedVersion,
  });
  writePluginConfigFile(pluginConfig);
}

function addExtensionToConfig(packageName, yarnInfo) {
  addToAndOverwriteConfig(packageName, yarnInfo, addExtensionToConfigJson);
}

function addModeToConfig(packageName, yarnInfo) {
  addToAndOverwriteConfig(packageName, yarnInfo, addModeToConfigJson);
}

export { addExtensionToConfig, addModeToConfig };
