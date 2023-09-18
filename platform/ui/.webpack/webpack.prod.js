const { merge } = require('webpack-merge');
const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const webpackCommon = require('./../../../.webpack/webpack.base.js');
const pkg = require('./../package.json');

const ROOT_DIR = path.join(__dirname, './..');
const SRC_DIR = path.join(__dirname, '../src');
const DIST_DIR = path.join(__dirname, '../dist');

const ENTRY = {
  app: `${SRC_DIR}/index.js`,
};

const outputName = `ohif-${pkg.name.split('/').pop()}`;

module.exports = (env, argv) => {
  const commonConfig = webpackCommon(env, argv, { SRC_DIR, DIST_DIR, ENTRY });

  return merge(commonConfig, {
    stats: {
      colors: true,
      hash: true,
      timings: true,
      assets: true,
      chunks: false,
      chunkModules: false,
      modules: false,
      children: false,
      warnings: true,
    },
    optimization: {
      minimize: true,
      sideEffects: false,
    },
    output: {
      path: ROOT_DIR,
      library: 'ohif-ui',
      libraryTarget: 'umd',
      filename: pkg.main,
    },
    externals: [
      /\b(dcmjs)/,
      /\b(gl-matrix)/,
      {
        react: 'React',
        'react-dom': 'ReactDOM',
      },
    ],
    plugins: [
      new MiniCssExtractPlugin({
        filename: `./dist/${outputName}.css`,
        chunkFilename: `./dist/${outputName}.css`,
      }),
      // new BundleAnalyzerPlugin({}),
    ],
  });
};
