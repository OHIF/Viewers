import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import spdxLicenseList from 'spdx-license-list/full.js';

const writeFile = promisify(fs.writeFile);

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
  return writeFile(targetPath, licenseContent, 'utf8');
}

export default createLicense;
