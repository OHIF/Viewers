import installNPMPackage from './utils/installNPMPackage.js';
import readPluginConfigFile from './utils/readPluginConfigFile.js';
import getPackageVersion from './utils/getPackageVersion.js';
import { addExtensionToConfig } from './utils/manipulatePluginConfigFile.js';
import writePluginConfig from './utils/writePluginConfig.js';

export default async function addExtension(packageName, version) {
  console.log('Adding ohif extension...');
  console.log(
    'Note: There is currently no validation that this npm package is an ohif-extension.'
  );
  await installNPMPackage(packageName, version);

  // Find the version actually installed using yarn info, as version is optional
  version = await getPackageVersion(packageName);

  const pluginConfig = readPluginConfigFile();

  if (!pluginConfig) {
    pluginConfig = {
      extensions: [],
      modes: [],
    };
  }

  addExtensionToConfig(pluginConfig, { packageName, version });
  writePluginConfig(pluginConfig);

  console.log('Extension Added');
}
