const excludeNodeModulesExcept = require('./../helpers/excludeNodeModulesExcept.js');

function transpileJavaScript(mode) {
  const exclude =
    mode === 'production'
      ? excludeNodeModulesExcept([
          'vtk.js',
          'dicomweb-client',
          'react-dnd',
          'dcmjs', // contains: loglevelnext
          'loglevelnext',
          // '@ohif/extension-dicom-microscopy' contains:
          'dicom-microscopy-viewer',
          'ol',
        ])
      : excludeNodeModulesExcept([]);

  return {
    test: /\.jsx?$/,
    // These are packages that are not transpiled to our lowest supported
    // JS version (currently ES5). Most of these leverage ES6+ features,
    // that we need to transpile to a different syntax.
    exclude,
    loader: 'babel-loader',
    options: {
      // Find babel.config.js in monorepo root
      // https://babeljs.io/docs/en/options#rootmode
      rootMode: 'upward',
      envName: mode,
    },
  };
}

module.exports = transpileJavaScript;
