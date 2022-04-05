const path = require('path');
const pkg = require('../package.json');

const outputFile = 'index.umd.js';
const rootDir = path.resolve(__dirname, '../');
const outputFolder = path.join(__dirname, '../dist');

const config = {
  mode: 'production',
  entry: rootDir + '/' + pkg.module,
  devtool: 'inline-source-map',
  output: {
    path: outputFolder,
    filename: outputFile,
    library: pkg.name,
    libraryTarget: 'umd',
    umdNamedDefine: true,
    globalObject: "typeof self !== 'undefined' ? self : this",
  },
  externals: [
    {
      react: {
        root: 'React',
        commonjs2: 'react',
        commonjs: 'react',
        amd: 'react',
      },
    },
  ],
  module: {
    rules: [
      {
        test: /(\.jsx|\.js)$/,
        loader: 'babel-loader',
        exclude: /(node_modules|bower_components)/,
        resolve: {
          extensions: ['.js', '.jsx'],
        },
      },
    ],
  },
  resolve: {
    modules: [path.resolve('./node_modules'), path.resolve('./src')],
    extensions: ['.json', '.js', '.jsx'],
  },
};

module.exports = config;
