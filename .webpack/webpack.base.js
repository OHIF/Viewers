const path = require('path');
const webpack = require('webpack');
const loadShadersRule = require('./rules/loadShaders.js');
const loadWebWorkersRule = require('./rules/loadWebWorkers.js');
const transpileJavaScriptRule = require('./rules/transpileJavaScript.js');

module.exports = (env, argv, { SRC_DIR, DIST_DIR }) => {
  if (!process.env.NODE_ENV) {
    throw new Error('process.env.NODE_ENV not set');
  }

  const mode =
    process.env.NODE_ENV === 'production' ? 'production' : 'development';

  return {
    mode,
    entry: {
      app: `${SRC_DIR}/index.js`,
    },
    context: SRC_DIR,
    module: {
      rules: [
        transpileJavaScriptRule(mode),
        loadWebWorkersRule,
        loadShadersRule,
      ],
    },
    resolve: {
      // Which directories to search when resolving modules
      modules: [
        // Modules specific to this package
        path.resolve(__dirname, '../node_modules'),
        // Hoisted Yarn Workspace Modules
        path.resolve(__dirname, '../../../node_modules'),
        SRC_DIR,
      ],
      // Attempt to resolve these extensions in order.
      extensions: ['.js', '.jsx', '.json', '*'],
      // symlinked resources are resolved to their real path, not their symlinked location
      symlinks: true,
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
        'process.env.DEBUG': JSON.stringify(process.env.DEBUG),
        'process.env.APP_CONFIG': JSON.stringify(process.env.APP_CONFIG || ''),
        'process.env.PUBLIC_URL': JSON.stringify(process.env.PUBLIC_URL || '/'),
      }),
    ],
    // Fix: https://github.com/webpack-contrib/css-loader/issues/447#issuecomment-285598881
    // For issue in cornerstone-wado-image-loader
    node: {
      fs: 'empty',
    },
  };
};
