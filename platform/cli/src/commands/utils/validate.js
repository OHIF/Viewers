import registryUrl from 'registry-url';
import keywords from '../enums/keywords.js';
import getPackageNameAndScope from './getPackageNameAndScope.js';
import chalk from 'chalk';
import fetch from 'node-fetch';

export async function validateMode(packageName, version) {
  return validate(packageName, version, keywords.MODE);
}

export async function validateExtension(packageName, version) {
  return validate(packageName, version, keywords.MODE);
}

function validate(packageName, version, keyword) {
  return new Promise(async (resolve, reject) => {
    const { scope } = getPackageNameAndScope(packageName);

    // Gets the registry of the package. Scoped packages may not be using the global default.
    const registryUrlOfPackage = registryUrl(scope);

    console.log(`${registryUrlOfPackage}${packageName}`);

    const response = await fetch(`${registryUrlOfPackage}${packageName}`);
    const json = await response.json();

    if (version === undefined) {
      // Get latest
      version = json['dist-tags'].latest;
    }

    const versionedJson = json.versions[version];
    const keywords = versionedJson.keywords;

    const isValid = keywords.includes(keyword);

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
