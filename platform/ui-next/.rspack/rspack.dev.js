const path = require('path');
const rspackBase = require('./../../../.rspack/rspack.base.js');
const SRC_DIR = path.join(__dirname, '../src');
const DIST_DIR = path.join(__dirname, '../dist');
const ENTRY = {
  app: `${SRC_DIR}/index.ts`,
};

module.exports = (env, argv) => {
  return rspackBase(env, argv, { SRC_DIR, DIST_DIR, ENTRY });
};
