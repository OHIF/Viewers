const path = require('path');
const pkg = require('../package.json');

const rootDir = path.resolve(__dirname, '../');
const outputFolder = path.join(__dirname, `../dist/umd/${pkg.name}/`);
const outputFile = 'index.umd.js';

const config = {
  mode: 'development',
  entry: rootDir + '/' + pkg.module,
  devtool: 'source-map',
  output: {
    path: outputFolder,
    filename: outputFile,
    library: pkg.name,
    publicPath: `/umd/${pkg.name}/`,
    libraryTarget: 'umd',
    chunkFilename: '[name].chunk.js',
    umdNamedDefine: true,
  },
  externals: [
    {
      "cornerstone-wado-image-loader": {
        root: 'cornerstone-wado-image-loader',
        commonjs2: 'cornerstone-wado-image-loader',
        commonjs: 'cornerstone-wado-image-loader',
        amd: 'cornerstone-wado-image-loader',
      },
      'moment': {
        root: 'moment',
        commonjs2: 'moment',
        commonjs: 'moment',
        amd: 'moment',
      },
      'react': {
        root: 'React',
        commonjs2: 'react',
        commonjs: 'react',
        amd: 'react',
      },
      'react-i18next': {
        root: 'react-i18next',
        commonjs2: 'react-i18next',
        commonjs: 'react-i18next',
        amd: 'react-i18next',
      },
      'prop-types': {
        root: 'prop-types',
        commonjs2: 'prop-types',
        commonjs: 'prop-types',
        amd: 'prop-types',
      },
      'react-resize-detector': {
        root: 'react-resize-detector',
        commonjs2: 'react-resize-detector',
        commonjs: 'react-resize-detector',
        amd: 'react-resize-detector',
      },
      '@cornerstonejs/tools': {
        root: '@cornerstonejs/tools',
        commonjs2: '@cornerstonejs/tools',
        commonjs: '@cornerstonejs/tools',
        amd: '@cornerstonejs/tools',
      },
      '@cornerstonejs/core': {
        root: '@cornerstonejs/core',
        commonjs2: '@cornerstonejs/core',
        commonjs: '@cornerstonejs/core',
        amd: '@cornerstonejs/core',
      },
      'config-point': {
        root: 'config-point',
        commonjs2: 'config-point',
        commonjs: 'config-point',
        amd: 'config-point',
      },
      'classnames': {
        root: 'classnames',
        commonjs2: 'classnames',
        commonjs: 'classnames',
        amd: 'classnames',
      },
      'react-router-dom': {
        root: 'react-router-dom',
        commonjs2: 'react-router-dom',
        commonjs: 'react-router-dom',
        amd: 'react-router-dom',
      },
      'dicomweb-client': {
        root: 'dicomweb-client',
        commonjs2: 'dicomweb-client',
        commonjs: 'dicomweb-client',
        amd: 'dicomweb-client',
      },
      dcmjs: {
        root: 'dcmjs',
        commonjs2: 'dcmjs',
        commonjs: 'dcmjs',
        amd: 'dcmjs',
      },
      '@ohif/core': {
        commonjs2: '@ohif/core',
        commonjs: '@ohif/core',
        amd: '@ohif/core',
        root: '@ohif/core',
      },
      '@ohif/ui': {
        commonjs2: '@ohif/ui',
        commonjs: '@ohif/ui',
        amd: '@ohif/ui',
        root: '@ohif/ui',
      },
      '@ohif/extension-default': {
        commonjs2: '@ohif/extension-default',
        commonjs: '@ohif/extension-default',
        amd: '@ohif/extension-default',
        root: '@ohif/extension-default',
      },
    },
  ],
  module: {
    rules: [
      {
        test: /(\.jsx|\.js|\.tsx|\.ts)$/,
        loader: 'babel-loader',
        exclude: /(node_modules|bower_components)/,
        resolve: {
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
      },
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
  resolve: {
    modules: [path.resolve('../node_modules'), path.resolve('./node_modules'), path.resolve('./src')],
    extensions: ['.json', '.js', '.jsx', '.tsx', '.ts'],
  },
};

module.exports = config;
