const autoprefixer = require('autoprefixer');
const path = require('path');
const fs = require('fs');
const tailwindcss = require('tailwindcss');
const tailwindConfigPath = path.resolve(
  '../../platform/viewer/tailwind.config.js'
);
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const devMode = process.env.NODE_ENV !== 'production';

const withTailwind = fs.existsSync(tailwindConfigPath);

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
            withTailwind && [tailwindcss(tailwindConfigPath)],
            [autoprefixer('last 2 version', 'ie >= 11')],
          ].filter(Boolean),
        },
      },
    },
  ],
};

module.exports = cssToJavaScript;
