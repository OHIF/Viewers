/**
 * This allows us to include web workers in our bundle, and VTK.js
 * web workers in our bundle. While this increases bundle size, it
 * cuts down on the number of includes we need for `script tag` usage.
 */
const loadWebWorkers = {
  test: /\.worker\.js$/,
  include: /vtk\.js[\/\\]Sources|dicom-microscopy-viewer[\/\\]/,
  use: [
    {
      loader: 'worker-loader',
      options: { inline: 'no-fallback' },
    },
  ],
};

module.exports = loadWebWorkers;
