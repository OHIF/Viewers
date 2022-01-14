const QUESTIONS = {
  //
  createExtension: [
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
      type: 'input',
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
  //
  // "create-mode"
};

export default QUESTIONS;
