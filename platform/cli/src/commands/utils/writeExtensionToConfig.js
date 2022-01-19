import readPluginConfigFile from './readPluginConfigFile.js';
import { addExtensionToConfig } from './manipulatePluginConfigFile.js';
import writePluginConfigFile from './writePluginConfigFile.js';

export default function writeExtensionToConfig(packageName, yarnInfo) {
  const installedVersion = yarnInfo.version;
  const pluginConfig = readPluginConfigFile();

  if (!pluginConfig) {
    pluginConfig = {
      extensions: [],
      modes: [],
    };
  }

  addExtensionToConfig(pluginConfig, {
    packageName,
    version: installedVersion,
  });
  writePluginConfigFile(pluginConfig);
}
