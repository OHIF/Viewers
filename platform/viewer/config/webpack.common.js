const path = require('path');
const webpack = require('webpack');
const ExtractCssChunks = require('extract-css-chunks-webpack-plugin');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

// Stylus: https://gist.github.com/mburakerman/e5e8328dc88085396adbff3804a1fb51

const SRC_DIR = path.join(__dirname, '../src');
const PUBLIC_DIR = path.join(__dirname, '../public');
const DIST_DIR = path.join(__dirname, '../dist');

module.exports = (env, argv) => {
  return {
    //
    plugins: [
      // "Public" Folder
      new CopyWebpackPlugin([
        {
          from: PUBLIC_DIR,
          to: DIST_DIR,
          toType: 'dir',
          // Ignore our HtmlWebpackPlugin template file
          ignore: ['index.html', '.DS_Store'],
        },
      ]),
      new webpack.EnvironmentPlugin(['NODE_ENV']),
      new ExtractCssChunks({
        filename: '[name].css',
        chunkFilename: '[id].css',
        // hot: true /* only necessary if hot reloading not function*/
      }),
      /**
       * This generates our index.html file from the specified template.
       * This is the easiest way to inject custom configuration and extensions.
       */
      new HtmlWebpackPlugin({
        template: `${PUBLIC_DIR}/index.html`,
        filename: 'index.html',
        templateParameters: {
          PUBLIC_URL: '',
          REACT_APP_CONFIG: 'config/default.js',
        },
        // favicon: `${PUBLIC_DIR}/favicon.ico`,
      }),
    ],
  };
};
