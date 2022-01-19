import { removeModeFromConfig } from './manipulatePluginConfigFile.js';
import readPluginConfigFile from './readPluginConfigFile.js';
import writePluginConfigFile from './writePluginConfigFile.js';

export default function removeModeFromConfigFile(packageName) {
  const pluginConfig = readPluginConfigFile();

  // Note: if file is not found, nothing to remove.
  if (pluginConfig) {
    removeModeFromConfig(pluginConfig, { packageName });
    writePluginConfigFile(pluginConfig);
  }
}
