const { merge } = require('webpack-merge');
const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const webpackCommon = require('./../../../.webpack/webpack.base.js');
const pkg = require('./../package.json');
const ROOT_DIR = path.join(__dirname, './..');
const SRC_DIR = path.join(__dirname, '../src');
const DIST_DIR = path.join(__dirname, '../dist');
const cssToJavaScript = require('../../../.webpack/rules/cssToJavaScript');

module.exports = (env, argv) => {
  const commonConfig = webpackCommon(env, argv, { SRC_DIR, DIST_DIR });

  commonConfig.plugins.push(
    new MiniCssExtractPlugin({
      filename: 'dist/[name].bundle.css',
      chunkFilename: 'dist/[id].css',
    })
  );

  commonConfig.module.rules.push(cssToJavaScript)

  return merge(commonConfig, {
    output: {
      path: ROOT_DIR,
      library: 'ohifUi',
      libraryTarget: 'umd',
      filename: pkg.main,
    },
    externals: {
      react: 'react',
      'react-dom': 'react-dom',
    },
  })
};
