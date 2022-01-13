import chalk from 'chalk';
import fs from 'fs';
import ncp from 'ncp';
import path from 'path';
import { promisify } from 'util';
import Listr from 'listr';

const copy = promisify(ncp);
const mkdir = promisify(fs.mkdir);
const exists = promisify(fs.exists);

// Copy from a source to a destination
async function copyTemplate(src, dest) {
  return await copy(src, dest, {
    clobber: false,
  });
}

async function editPackageJson(targetDir, options) {
  const { name, version, description, author, license } = options;

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

export { copyTemplate, editPackageJson };
