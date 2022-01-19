import { removeExtensionFromConfig } from './manipulatePluginConfigFile.js';
import readPluginConfigFile from './readPluginConfigFile.js';
import writePluginConfigFile from './writePluginConfigFile.js';

export default function removeExtensionFromConfigFile(packageName) {
  const pluginConfig = readPluginConfigFile();

  // Note: if file is not found, nothing to remove.
  if (pluginConfig) {
    removeExtensionFromConfig(pluginConfig, { packageName });
    writePluginConfigFile(pluginConfig);
  }
}
