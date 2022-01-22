import fs from 'fs';
import path from 'path';
import { execa } from 'execa';
import {
  validateYarn,
  addExtensionToConfig,
  addModeToConfig,
} from './utils/index.js';

async function linkPackage(packageDir, options, addToConfig) {
  const { viewerDirectory } = options;

  // read package.json from packageDir
  const file = fs.readFileSync(path.join(packageDir, 'package.json'), 'utf8');

  // name of the package
  const packageJSON = JSON.parse(file);
  const packageName = packageJSON.name;
  const version = packageJSON.version;

  // make sure yarn is installed
  await validateYarn();

  // change directory to packageDir and execute yarn link
  process.chdir(packageDir);

  let results;
  results = await execa(`yarn`, ['link']);

  // change directory to OHIF Platform root and execute yarn link
  process.chdir(viewerDirectory);

  results = await execa(`yarn`, ['link', packageName]);
  console.log(results.stdout);
  addToConfig(packageName, { version });
}

function linkExtension(packageDir, options) {
  linkPackage(packageDir, options, addExtensionToConfig);
}

function linkMode(packageDir, options) {
  linkPackage(packageDir, options, addModeToConfig);
}

export { linkExtension, linkMode };
