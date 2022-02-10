const autoprefixer = require('autoprefixer');
const path = require('path');
const tailwindcss = require('tailwindcss');
const tailwindConfigPath = path.resolve('tailwind.config.js');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const devMode = process.env.NODE_ENV !== 'production';

module.exports = {
  stories: [
    '../src/components/CinePlayer/CinePlayer.stories.js',
    //'../src/**/*.stories.mdx',
    '../src/**/*.stories.@(js|jsx|ts|tsx)',
  ],
  addons: ['@storybook/addon-links', '@storybook/addon-essentials'],
  core: {
    builder: 'webpack5',
  },
  webpackFinal: async (config, { configType }) => {
    // `configType` has a value of 'DEVELOPMENT' or 'PRODUCTION'
    // You can change the configuration based on that.
    // 'PRODUCTION' is used when building the static version of storybook.
    config.module.rules[0].use[0].options.plugins[1] = [
      '@babel/plugin-proposal-class-properties',
      { loose: true },
    ];

    // Make whatever fine-grained changes you need
    config.module.rules.push({
      test: /\.m?js/,
      resolve: {
        fullySpecified: false,
      },
    });

    // Default rule for images /\.(svg|ico|jpg|jpeg|png|gif|eot|otf|webp|ttf|woff|woff2|cur|ani|pdf)(\?.*)?$/
    const fileLoaderRule = config.module.rules.find(
      rule => rule.test && rule.test.test('.svg')
    );
    fileLoaderRule.exclude = /\.svg$/;

    console.log(JSON.stringify(config.module.rules, null, 2));

    config.module.rules.push({
      test: /\.svg$/,
      use: [
        { loader: require.resolve('babel-loader') },
        //        { loader: 'svg-inline-loader' },
      ],
    });

    config.module.rules.push({
      test: /\.css$/,
      use: [
        //'style-loader',
        //devMode ? 'style-loader' : MiniCssExtractPlugin.loader,
        //{ loader: 'css-loader', options: { importLoaders: 1 } },
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
      include: path.resolve(__dirname, '../'),
    });

    // Return the altered config
    return config;
  },
};
