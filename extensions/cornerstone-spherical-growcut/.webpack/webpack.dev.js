const path = require('path');
const webpackCommon = require('./../../../.webpack/webpack.commonjs.js');
const SRC_DIR = path.join(__dirname, '../src');
const DIST_DIR = path.join(__dirname, '../dist');

module.exports = (env, argv) => {
  return webpackCommon(env, argv, { SRC_DIR, DIST_DIR });
};
