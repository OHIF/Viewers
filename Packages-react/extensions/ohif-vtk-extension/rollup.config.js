import babel from 'rollup-plugin-babel'
import commonjs from 'rollup-plugin-commonjs'
import external from 'rollup-plugin-peer-deps-external'
import postcss from 'rollup-plugin-postcss'
import resolve from 'rollup-plugin-node-resolve'
import url from 'rollup-plugin-url'
import pkg from './package.json'
// Deal with https://github.com/rollup/rollup-plugin-commonjs/issues/297
import builtins from 'rollup-plugin-node-builtins';

const globals =  {
  'react': 'React',
  'react-dom': 'ReactDOM',
  'react-redux': 'ReactRedux',
  'react-resize-detector': 'ReactResizeDetector',
  'prop-types': 'PropTypes',
  'cornerstone-core': 'cornerstone',
  'cornerstone-wado-image-loader': 'cornerstoneWADOImageLoader',
  'cornerstone-math': 'cornerstoneMath',
  'cornerstone-tools': 'cornerstoneTools',
  'dcmjs': 'dcmjs',
  'dicom-parser': 'dicomParser',
  'ohif-core': 'OHIF',
  'hammerjs': 'Hammer'
};

export default {
  input: 'src/index.js',
  output: [
    {
      file: pkg.main,
      format: 'umd',
      name: 'ohif-vtk-extension',
      sourcemap: true,
      globals
    },
    {
      file: pkg.module,
      format: 'es',
      sourcemap: true,
      globals
    }
  ],
  plugins: [
    builtins(),
    external(),
    postcss({
      modules: false
    }),
    url(),
    babel({
      exclude: 'node_modules/**',
      externalHelpers: true,
      runtimeHelpers: true
    }),
    resolve(),
    commonjs({
      include: ['node_modules/**', '.yalc/**'],
      namedExports: {
          'node_modules/react-vtkjs-viewport/dist/index.js': [
            'getImageData',
            'loadImageData',
            'VTKViewport',
            'VTKMPRViewport',
          ],
          '.yalc/react-vtkjs-viewport/dist/index.js': [
            'getImageData',
            'loadImageData',
            'VTKViewport',
            'VTKMPRViewport',
          ]
      }
    })
  ],
  external: Object.keys(pkg.peerDependencies || {}),
}
