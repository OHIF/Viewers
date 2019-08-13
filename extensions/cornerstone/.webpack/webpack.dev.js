const path = require('path');
const merge = require('webpack-merge');
const webpackCommon = require('./../../../.webpack/webpack.common.js');

//
const SRC_DIR = path.join(__dirname, '../src');
const DIST_DIR = path.join(__dirname, '../dist');

module.exports = (env, argv) => {
  const commonConfig = webpackCommon(env, argv, { SRC_DIR, DIST_DIR });

  return merge(commonConfig, {
    // https://webpack.js.org/configuration/mode/#mode-development
    mode: 'development',
  });
};
