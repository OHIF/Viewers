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
    output: {
      path: DIST_DR, // push to common?
      publicPath: '/',
      // filename: '[name].bundle.js',
    },
  });
};

// TODO: In-progress. Merging these
// LINKS:
// https://webpack.js.org/guides/development/
// https://webpack.js.org/configuration/dev-server/
// https://www.prohipaa.com/en/training
module.exports = (env, argv) => {
  const commonConfig = common(env, argv);

  return merge(commonConfig, {
    module: {
      rules: [
        {
          test: /\.(gif|jp?g|png|svg|ico)$/i,
          use: [
            {
              loader: 'file-loader',
              options: {
                name: '[path][name].[ext]',
                context: SRC_DIR,
              },
            },
          ],
        },
        {
          test: /\.(ttf|eot|woff|woff2)$/i,
          use: [
            {
              loader: 'file-loader',
              options: {
                name: '[name].[ext]',
              },
            },
          ],
        },
      ],
    },
    plugins: [new webpack.HotModuleReplacementPlugin()],
    devServer: {
      inline: true,
      compress: false,
      open: true,
      port: 3000,
      writeToDisk: true,
      historyApiFallback: true,
    },
  });
};
