const path = require('path');
const fs = require('fs');

const directoryPath = path.join(__dirname, 'src', 'locales');
const { lstatSync, readdirSync } = require('fs');
const { join } = require('path');

const isDirectory = source => lstatSync(source).isDirectory();
const getDirectories = source =>
  readdirSync(source)
    .map(name => join(source, name))
    .filter(isDirectory);

const getJSONFiles = source =>
  readdirSync(source)
    .filter(name => name.includes('.json'))
    .map(name => join(source, name))
    .filter(a => !isDirectory(a));

const directories = getDirectories(directoryPath);

function writeFile(filepath, name, content) {
  fs.writeFile(path.join(filepath, name), content, err => {
    if (err) {
      throw err;
    }
  });
}

// For each language directory
const languages = [];
directories.forEach(directory => {
  const language = path.basename(directory);
  languages.push(language);
  const name = 'index.js';

  // Create one file (index.js) inside the language folder
  // For each namespace
  let content = '';

  const files = getJSONFiles(directory);
  const namespaces = files.map(file => path.basename(file, '.json'));

  files.forEach(file => {
    const filename = path.basename(file);
    const namespace = path.basename(file, '.json');

    content += `import ${namespace} from './${filename}';\n`;
  });

  content += '\n';
  let exportLines = `export default { \n  '${language}': {\n`;
  namespaces.forEach(namespace => {
    exportLines += `    ${namespace},\n`;
  });
  exportLines += '  }\n};\n';

  content += exportLines;

  // If the file {namespace}.json is present,
  // create a file to import the namespace and
  // export all of the namespaces for the language
  // e.g.
  // import namespace from './{namespace}.json';
  // export { namespace1, namespace2, ... }
  writeFile(directory, name, content);
});

let fileContent = '';
const languageVariables = languages.map(language => {
  const languageVariable = language.replace('-', '_');

  fileContent += `import ${languageVariable} from './${language}/';\n`;

  return languageVariable;
});

fileContent += '\n';

fileContent += 'export default {\n';
languageVariables.forEach(language => {
  fileContent += `  ...${language},\n`;
});

fileContent += '};\n';

// Create one file (index.js) inside the locales folder
// which exports each of the languages
// e.g.
// import language1 from './{language1}/'
// import language2 from './{language2}/'
//
// export { language1, language2 }
writeFile(directoryPath, 'index.js', fileContent);
