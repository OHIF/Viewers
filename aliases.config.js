/* Used by webpack, babel and eslint */

const path = require('path');

module.exports = {
  '@codinsky/parse-js': path.resolve(__dirname, 'packages/parse/src'),
  '@codinsky/curate': path.resolve(__dirname, 'packages/curate/src'),
};
