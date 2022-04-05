import path from 'path';

const QUESTIONS = {
  //
  createExtension: [
    {
      type: 'input',
      name: 'baseDir',
      message:
        'What is the target directory absolute/relative path to create your extension (we strongly recommend to use a separate directory from ohif extensions directory - unless you are developing a core extension which is highly unlikely):',
      validate: input => {
        if (!input) {
          console.log('Please provide a valid target directory path');
          return;
        }
        return true;
      },
      filter: input => {
        return path.resolve(input);
      },
    },
    {
      type: 'input',
      name: 'name',
      message: 'What is the name of your extension?',
      validate: input => {
        if (!input) {
          return 'Please enter a name';
        }
        return true;
      },
      default: 'my-extension',
    },
    {
      type: 'confirm',
      name: 'gitRepository',
      message: 'Should it be a git repository?',
    },
    {
      type: 'input',
      name: 'version',
      message: 'What is the version of your extension?',
      default: '0.0.1',
    },
    {
      type: 'input',
      name: 'description',
      message: 'What is the description of your extension?',
      default: '',
    },
    {
      type: 'input',
      name: 'author',
      message: 'Who is the author of your extension?',
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
      message: 'What is the license of your extension?',
      default: 'MIT',
    },
  ],
  createMode: [
    {
      type: 'input',
      name: 'baseDir',
      message:
        'What is the target directory absolute/relative path to create your mode (we strongly recommend to use a separate directory from ohif mode directory - unless you are developing a core mode which is highly unlikely):',
      validate: input => {
        if (!input) {
          console.log('Please provide a valid target directory path');
          return;
        }
        return true;
      },
      filter: input => {
        return path.resolve(input);
      },
    },
    {
      type: 'input',
      name: 'name',
      message: 'What is the name of your mode?',
      validate: input => {
        if (!input) {
          return 'Please enter a name';
        }
        return true;
      },
      default: 'my-mode',
    },
    {
      type: 'confirm',
      name: 'gitRepository',
      message: 'Should it be a git repository?',
      default: 'Y',
    },
    {
      type: 'input',
      name: 'version',
      message: 'What is the version of your mode?',
      default: '0.0.1',
    },
    {
      type: 'input',
      name: 'description',
      message: 'What is the description of your mode?',
      default: '',
    },
    {
      type: 'input',
      name: 'author',
      message: 'Who is the author of your mode?',
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
      message: 'What is the license of your mode?',
      default: 'MIT',
    },
  ],
};

export default QUESTIONS;
