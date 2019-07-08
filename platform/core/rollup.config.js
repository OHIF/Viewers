import babel from 'rollup-plugin-babel'
import commonjs from 'rollup-plugin-commonjs'
import external from 'rollup-plugin-peer-deps-external'
import postcss from 'rollup-plugin-postcss'
import resolve from 'rollup-plugin-node-resolve'
import url from 'rollup-plugin-url'
import json from 'rollup-plugin-json'
import svgr from '@svgr/rollup'
import pkg from './package.json'

const globals = {
  'react': 'React',
  'react-dom': 'ReactDOM',
  'cornerstone-core': 'cornerstone',
  'cornerstone-math': 'cornerstoneMath',
  'cornerstone-tools': 'cornerstoneTools',
  'cornerstone-wado-image-loader': 'cornerstoneWADOImageLoader',
  'dicom-parser': 'dicomParser'
};

export default {
  input: 'src/index.js',
  output: [
    {
      file: pkg.main,
      format: 'umd',
      name: 'OHIF',
      sourcemap: true,
      exports: 'named',
      globals
    },
    {
      file: pkg.module,
      format: 'es',
      sourcemap: true,
      exports: 'named',
      globals
    },
  ],
  plugins: [
    external(),
    postcss({
      modules: false
    }),
    url(),
    json(),
    svgr(),
    babel({
      exclude: 'node_modules/**',
      externalHelpers: false,
      runtimeHelpers: true
    }),
    resolve(),
    commonjs({
      include: 'node_modules/**',
      namedExports: {
          'node_modules/dicomweb-client/build/dicomweb-client.js': [
            'api'
          ]
      }
   }),
  ],
  external: Object.keys(pkg.peerDependencies || {}),
}
