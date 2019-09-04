const ExtractCssChunksPlugin = require('extract-css-chunks-webpack-plugin');

function extractStyleChunks(mode) {
  return [
    {
      test: /\.styl$/,
      use: [
        {
          loader: ExtractCssChunksPlugin.loader,
          options: {
            hot: mode === 'development',
          },
        },
        { loader: 'css-loader' },
        { loader: 'stylus-loader' },
      ],
    },
    {
      test: /\.(sa|sc|c)ss$/,
      use: [
        {
          loader: ExtractCssChunksPlugin.loader,
          options: {
            hot: mode === 'development',
          },
        },
        'css-loader',
        'postcss-loader',
        // 'sass-loader',
      ],
    },
  ];
}

module.exports = extractStyleChunks;
