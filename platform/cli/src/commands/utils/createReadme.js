import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import mustache from 'mustache';

const writeFile = promisify(fs.writeFile);

async function createReadme(options) {
  let template = `# {{name}} \n## Description \n{{description}} \n## Author \n{{author}} \n## License \n{{license}}`;
  const { name, description, author, license, targetDir } = options;
  const targetPath = path.join(targetDir, 'README.md');

  const readmeContent = mustache.render(template, {
    name,
    description,
    author,
    license,
  });

  return writeFile(targetPath, readmeContent, 'utf8');
}

export default createReadme;
