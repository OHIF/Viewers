import registryUrl from 'registry-url';
import keywords from '../enums/keywords.js';
import { getPackageNameAndScope } from './private/index.js';
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
    function rejectIfNotFound() {
      const error = new Error(`${chalk.red.bold('Error')} extension ${packageName} not installed`);
      reject(error);
    }

    const packageInfo = await getYarnInfo(packageName).catch(() => {
      rejectIfNotFound();
    });

    if (!packageInfo) {
      rejectIfNotFound();
      return;
    }

    const { keywords } = packageInfo;
    const isValid = keywords && keywords.includes(keyword);

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

function getVersion(json, version) {
  const versions = Object.keys(json.versions);
  // if no version is defined get the latest
  if (version === undefined) {
    return json['dist-tags'].latest;
  }

  // Get and validate version if it is explicitly defined
  const allowMinorVersionUpgrade = version.startsWith('^');
  if (!allowMinorVersionUpgrade) {
    const isValidVersion = versions.includes(version);

    if (!isValidVersion) {
      return;
    }

    return version;
  }

  // Choose version based on the newer minor/patch versions
  const [majorVersion] = version
    .split('^')[1]
    .split('.')
    .map(v => parseInt(v));

  // Find the version that matches the major version, but is the latest minor version
  versions
    .filter(version => parseInt(version.split('.')[0]) === majorVersion)
    .sort((a, b) => {
      const [majorA, minorA, patchA] = a.split('.').map(v => parseInt(v));
      const [majorB, minorB, patchB] = b.split('.').map(v => parseInt(v));

      if (majorA === majorB) {
        if (minorA === minorB) {
          return patchB - patchA;
        }

        return minorB - minorA;
      }

      return majorB - majorA;
    });

  if (versions.length === 0) {
    return;
  }

  return versions[0];
}

function validate(packageName, version, keyword) {
  return new Promise(async (resolve, reject) => {
    const { scope } = getPackageNameAndScope(packageName);

    // Gets the registry of the package. Scoped packages may not be using the global default.
    const registryUrlOfPackage = registryUrl(scope);
    let options = {};
    if (process.env.NPM_TOKEN) {
      options['headers'] = {
        Authorization: `Bearer ${process.env.NPM_TOKEN}`,
      };
    }
    const response = await fetch(`${registryUrlOfPackage}${packageName}`, options);
    const json = await response.json();

    if (json.error && json.error === NOT_FOUND) {
      const error = new Error(`${chalk.red.bold('Error')} package ${packageName} not found`);
      reject(error);
      return;
    }

    const packageVersion = getVersion(json, version);

    if (packageVersion) {
      const versionedJson = json.versions[packageVersion];
      const keywords = versionedJson.keywords;

      const isValid = keywords && keywords.includes(keyword);

      if (isValid) {
        resolve(true);
      } else {
        const error = new Error(
          `${chalk.red.bold('Error')} package ${packageName} is not an ${keyword}`
        );
        reject(error);
      }
    } else {
      // Particular version undefined
      const error = new Error(
        `${chalk.red.bold('Error')} version ${packageVersion} of package ${packageName} not found`
      );
      reject(error);
    }
  });
}

export { validateMode, validateExtension, validateModeYarnInfo, validateExtensionYarnInfo };
