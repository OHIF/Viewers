const autoprefixer = require('autoprefixer');

const cssToJavaScript = {
  test: /\.css$/,
  use: [
    'style-loader',
    { loader: 'css-loader', options: { importLoaders: 1 } },
    {
      loader: 'postcss-loader',
      options: {
        plugins: () => [autoprefixer('last 2 version', 'ie >= 11')],
      },
    },
  ],
};

module.exports = cssToJavaScript;
