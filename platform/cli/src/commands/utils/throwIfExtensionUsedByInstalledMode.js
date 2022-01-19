import { readPluginConfigFile } from './private/index.js';
import getYarnInfo from './getYarnInfo.js';
import chalk from 'chalk';

export default async function throwIfExtensionUsedByInstalledMode(packageName) {
  const pluginConfig = readPluginConfigFile();

  if (!pluginConfig) {
    // No other modes, not in use
    return false;
  }

  const { modes } = pluginConfig;

  const modesUsingExtension = [];

  for (let i = 0; i < modes.length; i++) {
    const mode = modes[i];
    const modePackageName = mode.packageName;
    const yarnInfo = await getYarnInfo(modePackageName);

    const peerDependencies = yarnInfo.peerDependencies;

    if (!peerDependencies) {
      continue;
    }

    if (Object.keys(peerDependencies).includes(packageName)) {
      modesUsingExtension.push(modePackageName);
    }
  }

  if (modesUsingExtension.length > 0) {
    let modesString = '';

    modesUsingExtension.forEach(packageName => {
      modesString += ` ${packageName}`;
    });

    const error = new Error(
      `${chalk.yellow.red(
        'Error'
      )} ohif-extension ${packageName} used by installed modes:${modesString}`
    );

    throw error;
  }
}
