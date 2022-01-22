import fs from 'fs';
import path from 'path';
import { execa } from 'execa';
import { validateYarn } from './utils/index.js';

const linkPackage = async (packageDir, options) => {
  const { viewerDirectory } = options;

  // read package.json from packageDir
  const packageJSON = fs.readFileSync(
    path.join(packageDir, 'package.json'),
    'utf8'
  );

  // name of the package
  const packageName = JSON.parse(packageJSON).name;

  // make sure yarn is installed
  await validateYarn();

  // change directory to packageDir and execute yarn link
  await execa(`cd ${packageDir} && yarn link`);

  // change directory to OHIF Platform root and execute yarn link
  await execa(`cd ${viewerDirectory} && yarn link ${packageName}`);

  //update the plugin.json file

  console.log('finished linking package');
};

export default linkPackage;
