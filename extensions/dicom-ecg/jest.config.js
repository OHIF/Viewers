const base = require('../../jest.config.base.js');

module.exports = {
  ...base,
  displayName: 'extension-dicom-ecg',
  rootDir: '.',
  moduleDirectories: ['node_modules', 'src'],
};
