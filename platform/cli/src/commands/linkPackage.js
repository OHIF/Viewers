import fs from 'fs';
import path from 'path';
import { execa } from 'execa';
import { keywords } from './enums/index.js';
import {
  validateYarn,
  addExtensionToConfig,
  addModeToConfig,
} from './utils/index.js';

async function linkPackage(packageDir, options, addToConfig, keyword) {
  const { viewerDirectory } = options;

  // read package.json from packageDir
  const file = fs.readFileSync(path.join(packageDir, 'package.json'), 'utf8');

  // name of the package
  const packageJSON = JSON.parse(file);
  const packageName = packageJSON.name;
  const packageKeywords = packageJSON.keywords;

  // check if package is an extension or a mode
  if (!packageKeywords.includes(keyword)) {
    throw new Error(`${packageName} is not ${keyword}`);
  }

  const version = packageJSON.version;

  // make sure yarn is installed
  await validateYarn();

  // change directory to packageDir and execute yarn link
  process.chdir(packageDir);

  let results;
  results = await execa(`yarn`, ['link']);

  // change directory to OHIF Platform root and execute yarn link
  process.chdir(`${viewerDirectory}/../..`);

  results = await execa(`yarn`, ['link', packageName]);
  console.log(results.stdout);

  // change directory to viewer packages and add the config item
  process.chdir(viewerDirectory);
  addToConfig(packageName, { version });
}

function linkExtension(packageDir, options) {
  const keyword = keywords.EXTENSION;
  linkPackage(packageDir, options, addExtensionToConfig, keyword);
}

function linkMode(packageDir, options) {
  const keyword = keywords.MODE;
  linkPackage(packageDir, options, addModeToConfig, keyword);
}

export { linkExtension, linkMode };
