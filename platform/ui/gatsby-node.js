const path = require('path');
// ~~ Plugins
const PnpWebpackPlugin = require(`pnp-webpack-plugin`); // Required until Webpack@5

exports.onCreateWebpackConfig = ({ stage, loaders, actions }) => {
  if (stage === 'build-html' || stage === 'develop-html') {
    actions.setWebpackConfig({
      module: {
        rules: [
          {
            test: /\@ohif\/core/,
            use: loaders.null(),
          },
          {
            test: /cornerstone\-math/,
            use: loaders.null(),
          },
        ],
      },
    });
  }

  actions.setWebpackConfig({
    node: { fs: 'empty' },
    resolve: {
      plugins: [PnpWebpackPlugin],
      // Note the '..' in the path because docz gatsby project lives in the '.docz' directory
      modules: [
        // platform/ui
        path.resolve(__dirname, '../node_modules'),
        // .docz
        'node_modules',
      ],
    },
    resolveLoader: {
      plugins: [PnpWebpackPlugin.moduleLoader(module)],
    },
  });
};
