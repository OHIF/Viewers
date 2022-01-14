import installNPMPackage from './utils/installNPMPackage.js';
import getPackageVersion from './utils/getPackageVersion.js';
import readPluginConfigFile from './utils/readPluginConfigFile.js';
import { addModeToConfig } from './utils/manipulatePluginConfigFile.js';
import writePluginConfig from './utils/writePluginConfig.js';

export default async function addMode(packageName, version) {
  console.log('Adding ohif mode...');
  console.log(
    'Note: There is currently no validation that this npm package is an ohif-extension.'
  );
  await await installNPMPackage(packageName, version);

  // Find the version actually installed using yarn info, as version is optional
  version = await getPackageVersion(packageName);

  const pluginConfig = readPluginConfigFile();

  if (!pluginConfig) {
    pluginConfig = {
      extensions: [],
      modes: [],
    };
  }

  addModeToConfig(pluginConfig, { packageName, version });
  writePluginConfig(pluginConfig);

  // TODO parse mode and add extensions

  console.log('Mode Added');
}
