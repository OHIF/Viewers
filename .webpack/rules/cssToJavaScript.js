const autoprefixer = require('autoprefixer');
const path = require('path');
const tailwindcss = require('tailwindcss');
const tailwindConfigPath = path.resolve('../../platform/app/tailwind.config.js');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const devMode = process.env.NODE_ENV !== 'production';

const cssToJavaScript = {
  test: /\.css$/,
  use: [
    //'style-loader',
    devMode ? 'style-loader' : MiniCssExtractPlugin.loader,
    { loader: 'css-loader', options: { importLoaders: 1 } },
    {
      loader: 'postcss-loader',
      options: {
        postcssOptions: {
          verbose: true,
          plugins: [
            [tailwindcss(tailwindConfigPath)],
            [autoprefixer('last 2 version', 'ie >= 11')],
          ],
        },
      },
    },
  ],
};

module.exports = cssToJavaScript;
