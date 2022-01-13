import chalk from 'chalk';
import fs from 'fs';
import ncp from 'ncp';
import path from 'path';
import { promisify } from 'util';
import spdxLicenseList from 'spdx-license-list/full';

const copy = promisify(ncp);
const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);
const exists = promisify(fs.exists);
const access = promisify(fs.access);

async function createLicense(options) {
  const { targetDir, name, email } = options;
  const targetPath = path.join(targetDir, 'LICENSE');

  let license;
  try {
    license = spdxLicenseList[options.license];
  } catch (err) {
    console.error(
      '%s License %s not found in the list of licenses',
      chalk.red.bold('ERROR'),
      options.license
    );
    process.exit(1);
  }

  const licenseContent = license.licenseText
    .replace('<year>', new Date().getFullYear())
    .replace('<copyright holders>', `${name} (${email})`);
  debugger;
  return writeFile(targetPath, licenseContent, 'utf8');
}

// Copy from a source to a destination
async function copyTemplate(src, dest) {
  // console.log('Copying template files...');
  return await copy(src, dest, {
    clobber: false,
  });
}

async function editPackageJson(options) {
  const { name, version, description, author, license, targetDir } = options;

  // read package.json from targetDir
  const packageJsonPath = path.join(targetDir, 'package.json');
  const rawData = fs.readFileSync(packageJsonPath, 'utf8');
  const packageJson = JSON.parse(rawData);

  // edit package.json
  packageJson.name = name;
  packageJson.version = version;
  packageJson.description = description;
  packageJson.author = author;
  packageJson.license = license;

  // write package.json back to targetDir
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
}

/**
 * Options include
 * - name
 * - version
 * - initialize git
 * - install dependencies
 * - description
 * - author
 * - license
 * @param {*} param0
 */

const validateOptions = options => {
  const { name, version, description, author, license } = options;

  if (!name) {
    throw new Error('Missing name');
  }

  return true;
};

export {
  copyTemplate,
  editPackageJson,
  access,
  validateOptions,
  createLicense,
};
