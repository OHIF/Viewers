const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const webpackCommon = require('./../../../.webpack/webpack.base.js');

const PLAYGROUND_DIR = path.join(__dirname, '../playground');
const DIST_DIR = path.join(__dirname, '../dist/playground');
const ENTRY = {
  app: path.join(PLAYGROUND_DIR, 'index.tsx'),
};

module.exports = (env, argv) => {
  const config = webpackCommon(env, argv, {
    SRC_DIR: PLAYGROUND_DIR,
    DIST_DIR,
    ENTRY,
  });

  config.output.path = DIST_DIR;

  const isProdBuild = process.env.NODE_ENV === 'production';

  config.plugins = [
    ...(config.plugins || []),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'template.html'),
      title: 'UI Next Prototype',
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.join(PLAYGROUND_DIR, 'public'),
          to: DIST_DIR,
          noErrorOnMissing: true,
        },
      ],
    }),
    ...(isProdBuild
      ? [
          new MiniCssExtractPlugin({
            filename: 'app.[contenthash].css',
            chunkFilename: '[name].[contenthash].css',
          }),
        ]
      : []),
  ];

  config.devServer = {
    hot: true,
    port: 3100,
    static: DIST_DIR,
    historyApiFallback: true,
  };

  return config;
};
