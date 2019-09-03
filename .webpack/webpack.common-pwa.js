const path = require('path');
const webpack = require('webpack');
const excludeNodeModulesExcept = require('./excludeNodeModulesExcept.js');

module.exports = (env, argv, { SRC_DIR, DIST_DIR }) => {
  if (!process.env.NODE_ENV) {
    throw new Error('process.env.NODE_ENV not set');
  }

  const mode =
    process.env.NODE_ENV === 'production' ? 'production' : 'development';

  return {
    mode,
    entry: {
      bundle: `${SRC_DIR}/index.js`,
    },
    context: SRC_DIR,
    module: {
      rules: [
        {
          test: /\.jsx?$/,
          // These are packages that are not transpiled to our lowest supported
          // JS version (currently ES5). Most of these leverage ES6+ features,
          // that we need to transpile to a different syntax.
          exclude: excludeNodeModulesExcept([
            'vtk.js',
            'dicomweb-client',
            'react-dnd',
            'dcmjs', // contains: loglevelnext
            'loglevelnext',
            // '@ohif/extension-dicom-microscopy' contains:
            'dicom-microscopy-viewer',
            'ol',
          ]),
          loader: 'babel-loader',
          options: {
            // Find babel.config.js in monorepo root
            // https://babeljs.io/docs/en/options#rootmode
            rootMode: 'upward',
            envName: mode,
          },
        },
        /**
         * This allows us to include web workers in our bundle, and VTK.js
         * web workers in our bundle. While this increases bundle size, it
         * cuts down on the number of includes we need for `script tag` usage.
         */
        {
          test: /\.worker\.js$/,
          include: /vtk\.js[\/\\]Sources/,
          use: [
            {
              loader: 'worker-loader',
              options: { inline: true, fallback: false },
            },
          ],
        },
        /**
         * This is exclusively used by `vtk.js` to bundle glsl files.
         */
        {
          test: /\.glsl$/i,
          include: /vtk\.js[\/\\]Sources/,
          loader: 'shader-loader',
        },
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
