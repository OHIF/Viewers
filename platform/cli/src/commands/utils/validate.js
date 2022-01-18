import registryUrl from 'registry-url';
import keywords from '../enums/keywords.js';
import getPackageNameAndScope from './getPackageNameAndScope.js';
import chalk from 'chalk';
import fetch from 'node-fetch';
import getYarnInfo from './getYarnInfo.js';
import NOT_FOUND from '../constants/notFound.js';

async function validateMode(packageName, version) {
  return validate(packageName, version, keywords.MODE);
}

async function validateExtension(packageName, version) {
  return validate(packageName, version, keywords.EXTENSION);
}

async function validateModeYarnInfo(packageName) {
  return validateYarnInfo(packageName, keywords.MODE);
}

async function validateExtensionYarnInfo(packageName) {
  return validateYarnInfo(packageName, keywords.EXTENSION);
}

function validateYarnInfo(packageName, keyword) {
  return new Promise(async (resolve, reject) => {
    const packageInfo = await getYarnInfo(packageName).catch(() => {
      const error = new Error(
        `${chalk.red.bold('Error')} extension ${packageName} not installed`
      );
      reject(error);
    });

    const isValid = packageInfo.keywords.includes(keyword);

    if (isValid) {
      resolve(true);
    } else {
      const error = new Error(
        `${chalk.red.bold('Error')} package ${packageName} is not an ${keyword}`
      );
      reject(error);
    }
  });
}

function validate(packageName, version, keyword) {
  return new Promise(async (resolve, reject) => {
    const { scope } = getPackageNameAndScope(packageName);

    // Gets the registry of the package. Scoped packages may not be using the global default.
    const registryUrlOfPackage = registryUrl(scope);

    const response = await fetch(`${registryUrlOfPackage}${packageName}`);
    const json = await response.json();

    if (json.error && json.error === NOT_FOUND) {
      const error = new Error(
        `${chalk.red.bold('Error')} package ${packageName} not found`
      );
      reject(error);
      return;
    }

    if (version === undefined) {
      // Get latest
      version = json['dist-tags'].latest;
    }

    if (json.versions[version]) {
      const versionedJson = json.versions[version];
      const keywords = versionedJson.keywords;

      const isValid = keywords && keywords.includes(keyword);

      if (isValid) {
        resolve(true);
      } else {
        const error = new Error(
          `${chalk.red.bold(
            'Error'
          )} package ${packageName} is not an ${keyword}`
        );
        reject(error);
      }
    } else {
      // Particular version undefined
      const error = new Error(
        `${chalk.red.bold(
          'Error'
        )} verson ${version} of package ${packageName} not found`
      );
      reject(error);
    }
  });
}

export {
  validateMode,
  validateExtension,
  validateModeYarnInfo,
  validateExtensionYarnInfo,
};
