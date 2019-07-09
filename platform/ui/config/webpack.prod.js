const merge = require('webpack-merge');
const path = require('path');
const common = require('./webpack.common');
const pkg = require('./../package.json');

const ROOT_DIR = path.join(__dirname, './..');
const SRC_DIR = path.join(__dirname, '../src');
const DIST_DIR = path.join(__dirname, '../dist');

module.exports = (env, argv) => {
  const commonConfig = common(env, argv);

  return merge(commonConfig, {
    mode: 'production',
    stats: {
      colors: false,
      hash: true,
      timings: true,
      assets: true,
      chunks: true,
      chunkModules: true,
      modules: true,
      children: true,
      warnings: true,
    },
    optimization: {
      minimize: true,
      sideEffects: true,
    },
    output: {
      path: ROOT_DIR,
      library: 'react-viewerbase',
      libraryTarget: 'umd',
      filename: pkg.main,
      auxiliaryComment: 'Test Comment',
    },
    module: {
      rules: [
        {
          test: /\.(gif|jpe?g|png|svg)$/i,
          use: [
            {
              loader: 'url-loader',
              options: {
                limit: 8192,
              },
            },
          ],
        },
        {
          test: /\.(ttf|eot|woff|woff2)$/i,
          use: [
            {
              loader: 'url-loader',
              options: {
                limit: 50000,
              },
            },
          ],
        },
      ],
    },
  });
};
