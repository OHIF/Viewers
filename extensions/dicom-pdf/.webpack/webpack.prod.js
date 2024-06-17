const webpack = require('webpack');
const { merge } = require('webpack-merge');
const path = require('path');
const webpackCommon = require('./../../../.webpack/webpack.base.js');
const pkg = require('./../package.json');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const ROOT_DIR = path.join(__dirname, './..');
const SRC_DIR = path.join(__dirname, '../src');
const DIST_DIR = path.join(__dirname, '../dist');
const ENTRY = {
  app: `${SRC_DIR}/index.tsx`,
};

const outputName = `ohif-${pkg.name.split('/').pop()}`;

module.exports = (env, argv) => {
  const commonConfig = webpackCommon(env, argv, { SRC_DIR, ENTRY, DIST_DIR });

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
      library: 'ohif-extension-dicom-pdf',
      libraryTarget: 'umd',
      filename: `${pkg.main}`,
    },
    externals: [/\b(vtk.js)/, /\b(dcmjs)/, /\b(gl-matrix)/, /^@ohif/, /^@cornerstonejs/],
    plugins: [
      new webpack.optimize.LimitChunkCountPlugin({
        maxChunks: 1,
      }),
      new MiniCssExtractPlugin({
        filename: `./dist/${outputName}.css`,
        chunkFilename: `./dist/${outputName}.css`,
      }),
      // new BundleAnalyzerPlugin(),
    ],
  });
};
