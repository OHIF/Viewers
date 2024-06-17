import fs from 'fs';

// https://github.dev/leoroese/template-cli/blob/628dd24db7df399ebb520edd0bc301bc7b5e8b66/index.js#L19
const createDirectoryContents = (templatePath, targetDirPath, copyPrettierRules) => {
  const filesToCreate = fs.readdirSync(templatePath);

  filesToCreate.forEach(file => {
    if (!copyPrettierRules && file === '.prettierrc') {
      return;
    }

    const origFilePath = `${templatePath}/${file}`;

    // get stats about the current file
    const stats = fs.statSync(origFilePath);

    if (stats.isFile()) {
      const contents = fs.readFileSync(origFilePath, 'utf8');

      // Rename
      if (file === '.npmignore') {
        file = '.gitignore';
      }

      const writePath = `${targetDirPath}/${file}`;
      fs.writeFileSync(writePath, contents, 'utf8');
    } else if (stats.isDirectory()) {
      fs.mkdirSync(`${targetDirPath}/${file}`);

      // recursive call
      createDirectoryContents(
        `${templatePath}/${file}`,
        `${targetDirPath}/${file}`,
        copyPrettierRules
      );
    }
  });
};

export default createDirectoryContents;
