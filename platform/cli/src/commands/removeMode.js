import uninstallNPMPackage from './utils/uninstallNPMPackage.js';
import readPluginConfigFile from './utils/readPluginConfigFile.js';
import { removeModeFromConfig } from './utils/manipulatePluginConfigFile.js';
import writePluginConfig from './utils/writePluginConfig.js';

export default async function removeMode(packageName) {
  console.log('Removing ohif mode...');
  console.log(
    'Note: There is currently no validation that this extension is an ohif-extension.'
  );
  await uninstallNPMPackage(packageName);

  const pluginConfig = readPluginConfigFile();

  // Note: if file is not found, nothing to remove.
  if (pluginConfig) {
    removeModeFromConfig(pluginConfig, { packageName });
    writePluginConfig(pluginConfig);
  }

  // TODO - Remove extensions if they aren't used by any other mode??

  console.log('Mode Removed');
}
