import path from 'path';
import fs from 'fs';

/**
 * Inside the id.js file in the templateDir,
 * replace all the file content with const id = `${options.name}`;
 * @param {string} templateDir target directory
 * @param {string} name mode or extension name
 */
function createIdAndVersion(options) {
  const { targetDir, name, version } = options;
  const idFile = path.join(targetDir, 'src/id.js');

  let toWrite = `const id = '${name}';`;
  toWrite += `\n\nconst version = '${version}';`;
  toWrite += `\n\nexport { id, version };`;

  fs.writeFileSync(idFile, toWrite, 'utf8');
}

export default createIdAndVersion;
