import path from 'path';
import os from 'os';

function getPathQuestions(packageType) {
  return [
    {
      type: 'input',
      name: 'name',
      message: `What is the name of your ${packageType}?`,
      validate: input => {
        if (!input) {
          return 'Please enter a name';
        }
        return true;
      },
      default: `my-${packageType}`,
    },
    {
      type: 'input',
      name: 'baseDir',
      message: `What is the target path to create your ${packageType}?`,
      suffix: `\n(we recommend you do not use the OHIF ${packageType} folder (./${packageType}s) unless you are developing a core ${packageType})`,
      maxLength: 40,
      validate: input => {
        if (!input) {
          console.log('Please provide a valid target directory path');
          return;
        }
        return true;
      },
      filter: (input, answers) => {
        // Replace ~ with the user's home directory
        const expandedPath = input.replace(/^~(?=$|\/|\\)/, os.homedir());

        // Resolve the path to an absolute path
        const resolvedPath = path.resolve(expandedPath, answers.name);

        return resolvedPath;
      },
    },
    {
      type: 'confirm',
      name: 'confirm',
      message: `Please confirm the above path for generating the ${packageType} folder:`,
    },
  ];
}

function getRepoQuestions(packageType) {
  return [
    {
      type: 'confirm',
      name: 'gitRepository',
      message: 'Should it be a git repository?',
      default: false,
    },
    {
      type: 'confirm',
      name: 'prettier',
      message: 'Should it follow same prettier rules as OHIF?',
    },
    {
      type: 'input',
      name: 'version',
      message: `What is the version of your ${packageType}?`,
      default: '0.0.1',
    },
    {
      type: 'input',
      name: 'description',
      message: `What is the description of your ${packageType}?`,
      default: '',
    },
    {
      type: 'input',
      name: 'author',
      message: `Who is the author of your ${packageType}?`,
      default: '',
    },
    {
      type: 'input',
      name: 'email',
      message: 'What is your email address?',
      default: '',
    },
    {
      type: 'input',
      name: 'license',
      message: `What is the license of your ${packageType}?`,
      default: 'MIT',
    },
  ];
}

export { getPathQuestions, getRepoQuestions };
