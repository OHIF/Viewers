const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
// const { TsconfigPathsPlugin } = require('tsconfig-paths-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

const isDevelopment = process.env.NODE_ENV !== 'production';
const isProdBuild = process.env.NODE_ENV === 'production';

const autoprefixer = require('autoprefixer');
const tailwindcss = require('tailwindcss');
const tailwindConfigPath = path.resolve('./tailwind.config.js');

const cssToJavaScript = {
  test: /\.css$/,
  use: [
    //'style-loader',
    isDevelopment ? 'style-loader' : MiniCssExtractPlugin.loader,
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

module.exports = {
  mode: 'development',
  entry: {
    home: './src/_pages/index.tsx',
    playground: './src/_pages/playground.tsx',
    patterns: './src/_pages/patterns.tsx',
    viewer: './src/_pages/viewer.tsx',
    colors: './src/_pages/colors.tsx',
    // add other pages here
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    // plugins: [new TsconfigPathsPlugin()],
  },

  module: {
    rules: [
      ...(isProdBuild
        ? []
        : [
            {
              test: /\.[jt]sx?$/,
              exclude: /node_modules/,
              loader: 'babel-loader',
              options: {
                plugins: ['react-refresh/babel'],
              },
            },
          ]),
      cssToJavaScript,
    ],
  },
  plugins: [
    new CleanWebpackPlugin(),

    new HtmlWebpackPlugin({
      template: './.webpack/template.html',
      chunks: ['home'],
      filename: 'index.html',
    }),
    new HtmlWebpackPlugin({
      template: './.webpack/template.html',
      chunks: ['playground'],
      filename: 'playground.html',
    }),
    new HtmlWebpackPlugin({
      template: './.webpack/template.html',
      chunks: ['patterns'],
      filename: 'patterns.html',
    }),
    new HtmlWebpackPlugin({
      template: './.webpack/template.html',
      chunks: ['viewer'],
      filename: 'viewer.html',
    }),
    new HtmlWebpackPlugin({
      template: './.webpack/template.html',
      chunks: ['colors'],
      filename: 'colors.html',
    }),
    new MiniCssExtractPlugin({
      filename: '[name].css',
    }),
    isDevelopment && new ReactRefreshWebpackPlugin(),
    !isDevelopment &&
      new MiniCssExtractPlugin({
        filename: '[name].css',
      }),
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
    },
    hot: true,
    open: true,
    port: 8002,
    historyApiFallback: true,
    devMiddleware: {
      writeToDisk: true,
    },
  },
};
