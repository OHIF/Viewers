const path = require('path');

exports.onCreateWebpackConfig = args => {
  args.actions.setWebpackConfig({
    resolve: {
      // Note the '..' in the path because docz gatsby project lives in the '.docz' directory
      modules: [
        // monorepo root
        path.resolve(__dirname, '../../../node_modules'),
        // platform/ui
        path.resolve(__dirname, '../node_modules'),
        // .docz
        'node_modules',
      ],
      // resolve: {
      //   symlinks: true,
      // },
    },
  });
};
