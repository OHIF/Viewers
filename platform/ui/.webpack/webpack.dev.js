const { merge } = require('webpack-merge');
const path = require('path');
const webpackCommon = require('./../../../.webpack/webpack.base.js');
const pkg = require('./../package.json');
const SRC_DIR = path.join(__dirname, '../src');
const DIST_DIR = path.join(__dirname, '../dist');
const ROOT_DIR = path.join(__dirname, './..');

module.exports = (env, argv) => {
  const commonConfig = webpackCommon(env, argv, { SRC_DIR, DIST_DIR });
  return merge(commonConfig, {
    output: {
      path: ROOT_DIR,
      library: 'ohifUi',
      libraryTarget: 'umd',
      filename: pkg.main,
    },
    externals: {
      react: 'React',
      'react-dom': 'ReactDOM',
    },
  })
};
