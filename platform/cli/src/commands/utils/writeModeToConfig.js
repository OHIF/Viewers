import readPluginConfigFile from './readPluginConfigFile.js';
import { addModeToConfig } from './manipulatePluginConfigFile.js';
import writePluginConfigFile from './writePluginConfigFile.js';

export default function writeModeToConfig(packageName, yarnInfo) {
  const installedVersion = yarnInfo.version;
  const pluginConfig = readPluginConfigFile();

  if (!pluginConfig) {
    pluginConfig = {
      extensions: [],
      modes: [],
    };
  }

  addModeToConfig(pluginConfig, {
    packageName,
    version: installedVersion,
  });
  writePluginConfigFile(pluginConfig);
}
