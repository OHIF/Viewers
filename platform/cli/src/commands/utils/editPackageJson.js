import fs from 'fs';
import path from 'path';

async function editPackageJson(options) {
  const { name, version, description, author, license, targetDir } = options;

  // read package.json from targetDir
  const dependenciesPath = path.join(targetDir, 'dependencies.json');
  const rawData = fs.readFileSync(dependenciesPath, 'utf8');
  const packageJson = JSON.parse(rawData);

  // edit package.json
  packageJson.name = name;
  packageJson.version = version;
  packageJson.description = description;
  packageJson.author = author;
  packageJson.license = license;
  packageJson.files = ['dist', 'README.md'];

  // write package.json back to targetDir
  const writePath = path.join(targetDir, 'package.json');
  fs.writeFileSync(writePath, JSON.stringify(packageJson, null, 2));

  // remove the dependencies.json file
  fs.unlinkSync(dependenciesPath);
}

export default editPackageJson;
