import {
  addExtensionToConfigJson,
  addModeToConfigJson,
  readPluginConfigFile,
  writePluginConfigFile,
} from './private/index.js';

function addToAndOverwriteConfig(packageName, options, augmentConfigFunction) {
  const installedVersion = options.version;
  let pluginConfig = readPluginConfigFile();

  if (!pluginConfig) {
    pluginConfig = {
      extensions: [],
      modes: [],
    };
  }

  augmentConfigFunction(pluginConfig, {
    packageName,
    version: installedVersion,
  });
  writePluginConfigFile(pluginConfig);
}

function addExtensionToConfig(packageName, options) {
  addToAndOverwriteConfig(packageName, options, addExtensionToConfigJson);
}

function addModeToConfig(packageName, options) {
  addToAndOverwriteConfig(packageName, options, addModeToConfigJson);
}

export { addExtensionToConfig, addModeToConfig };
