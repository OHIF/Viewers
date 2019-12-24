/**
 * This is exclusively used by `vtk.js` to bundle glsl files.
 */
const loadShaders = {
  test: /\.glsl$/i,
  include: /vtk\.js[\/\\]Sources/,
  loader: 'shader-loader',
};

module.exports = loadShaders;
