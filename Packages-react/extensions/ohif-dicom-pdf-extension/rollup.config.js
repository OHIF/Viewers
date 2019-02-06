import babel from 'rollup-plugin-babel'
import commonjs from 'rollup-plugin-commonjs'
import external from 'rollup-plugin-peer-deps-external'
import postcss from 'rollup-plugin-postcss'
import resolve from 'rollup-plugin-node-resolve'
import url from 'rollup-plugin-url'
import svgr from '@svgr/rollup'
import pkg from './package.json'
// Deal with https://github.com/rollup/rollup-plugin-commonjs/issues/297
import builtins from 'rollup-plugin-node-builtins';

const globals = {
  'react': 'React',
  'react-dom': 'ReactDOM',
  'prop-types': 'PropTypes',
  'ohif-core': 'OHIF',
  'dicom-parser': 'dicomParser'
};

export default {
  input: 'src/index.js',
  output: [
    {
      file: pkg.main,
      format: 'umd',
      name: 'ohif-dicom-pdf-extension',
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
    svgr(),
    babel({
      exclude: 'node_modules/**',
      plugins: [ '@babel/external-helpers' ],
      externalHelpers: true,
      runtimeHelpers: true
    }),
    resolve(),
    commonjs()
  ],
  external: Object.keys(pkg.peerDependencies || {}),
}
