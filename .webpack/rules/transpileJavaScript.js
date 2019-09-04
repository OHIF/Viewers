const excludeNodeModulesExcept = require('./../helpers/excludeNodeModulesExcept.js');

function transpileJavaScript(mode) {
  const exclude =
    mode === 'production'
      ? excludeNodeModulesExcept([
          'vtk.js',
          // 'dicomweb-client',
          // https://github.com/react-dnd/react-dnd/blob/master/babel.config.js
          'react-dnd',
          // https://github.com/dcmjs-org/dcmjs/blob/master/.babelrc
          // https://github.com/react-dnd/react-dnd/issues/1342
          // 'dcmjs', // contains: loglevelnext
          // https://github.com/shellscape/loglevelnext#browser-support
          // 'loglevelnext',
          // https://github.com/dcmjs-org/dicom-microscopy-viewer/issues/35
          // 'dicom-microscopy-viewer',
          // https://github.com/openlayers/openlayers#supported-browsers
          // 'ol', --> Should be fine
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
