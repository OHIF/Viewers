module.exports = function (context, options) {
  return {
    name: 'plugin-ohif-webpack-config',
    configureWebpack(config, isServer, utils) {
      return {
        resolve: {
          fallback: {
            fs: false,
            path: false,
          },
        },
        module: {
          rules: [
            {
              test: /\.m?jsx?$/,
              resolve: {
                fullySpecified: false,
              },
            },
          ],
        },
      };
    },
    configurePostCss(postcssOptions) {
      postcssOptions.plugins.push(
        require('postcss-import')
        /*require('postcss-preset-env')({
          autoprefixer: {
            flexbox: 'no-2009',
          },
          stage: 4,
        })*/
      );
      return postcssOptions;
    },
  };
};
