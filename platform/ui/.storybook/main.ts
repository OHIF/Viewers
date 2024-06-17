import path, { dirname, join } from 'path';
import remarkGfm from 'remark-gfm';
import type { StorybookConfig } from '@storybook/react-webpack5';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(mdx)'],
  addons: [
    getAbsolutePath('@storybook/addon-links'),
    getAbsolutePath('@storybook/addon-essentials'),
    // Other addons go here
    {
      name: '@storybook/addon-docs',
      options: {
        mdxPluginOptions: {
          mdxCompileOptions: {
            remarkPlugins: [remarkGfm],
          },
        },
      },
    },
  ],
  core: {},
  framework: {
    name: getAbsolutePath('@storybook/react-webpack5'),
    options: {},
  },
  docs: {
    autodocs: true, // see below for alternatives
    defaultName: 'Docs', // set to change the name of generated docs entries
  },
  staticDirs: ['../static'],
  webpackFinal: async (config: any, { configType }) => {
    // `configType` has a value of 'DEVELOPMENT' or 'PRODUCTION'
    // You can change the configuration based on that.
    // 'PRODUCTION' is used when building the static version of storybook.

    // config.module.rules[0].use[0].options.plugins[1] = [
    //   '@babel/plugin-proposal-class-properties',
    //   { loose: true },
    // ];

    // config.module.rules[0].use[0].options.plugins[3] = [
    //   '@babel/plugin-proposal-private-methods',
    //   { loose: true },
    // ];

    // config.module.rules[0].use[0].options.plugins[4] = [
    //   '@babel/plugin-proposal-private-property-in-object',
    //   { loose: true },
    // ];

    // Make whatever fine-grained changes you need
    config.module.rules.push({
      test: /\.m?js/,
      resolve: {
        fullySpecified: false,
      },
    });

    // Default rule for images /\.(svg|ico|jpg|jpeg|png|gif|eot|otf|webp|ttf|woff|woff2|cur|ani|pdf)(\?.*)?$/
    const fileLoaderRule = config.module.rules.find(rule => rule.test && rule.test.test('.svg'));
    fileLoaderRule.exclude = /\.svg$/;

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
        {
          loader: 'postcss-loader',
          options: {
            // HERE: OPTIONS
            postcssOptions: {
              plugins: [require('tailwindcss'), require('autoprefixer')],
            },
          },
        },
      ],
      include: path.resolve(__dirname, '../'),
    });

    // ignore the file @icr/polyseg-wasm during the build as it is a wasm file and
    // we don't need that for ui
    config.module.rules.push({
      test: /@icr\/polyseg-wasm/,
      type: 'javascript/auto',
      loader: 'file-loader',
    });

    // Return the altered config
    return config;
  },
};

export default config;

function getAbsolutePath(value: string): any {
  return dirname(require.resolve(join(value, 'package.json')));
}
