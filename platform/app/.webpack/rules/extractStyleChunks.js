const ExtractCssChunksPlugin = require('extract-css-chunks-webpack-plugin');

function extractStyleChunks(isProdBuild) {
  return [
    {
      test: /\.(sa|sc|c)ss$/,
      use: [
        {
          loader: ExtractCssChunksPlugin.loader,
          options: {
            hot: !isProdBuild,
          },
        },
        'css-loader',
        'postcss-loader',
      ],
    },
  ];
}

module.exports = extractStyleChunks;
