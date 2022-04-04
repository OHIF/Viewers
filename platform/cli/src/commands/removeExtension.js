import uninstallNPMPackage from './utils/uninstallNPMPackage.js';
import readPluginConfigFile from './utils/readPluginConfigFile.js';
import { removeExtensionFromConfig } from './utils/manipulatePluginConfigFile.js';
import writePluginConfig from './utils/writePluginConfig.js';

export default async function removeExtension(packageName) {
  console.log('Removing ohif extension...');
  console.log(
    'Note: There is currently no validation that this extension is an ohif-extension.'
  );
  await uninstallNPMPackage(packageName);

  const pluginConfig = readPluginConfigFile();

  // Note: if file is not found, nothing to remove.
  if (pluginConfig) {
    removeExtensionFromConfig(pluginConfig, { packageName });
    writePluginConfig(pluginConfig);
  }

  console.log('Extension Removed');
}
