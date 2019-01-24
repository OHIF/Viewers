import babel from 'rollup-plugin-babel'
import commonjs from 'rollup-plugin-commonjs'
import external from 'rollup-plugin-peer-deps-external'
import postcss from 'rollup-plugin-postcss'
import resolve from 'rollup-plugin-node-resolve'
import json from 'rollup-plugin-json'
import url from 'rollup-plugin-url'
import svgr from '@svgr/rollup'
import pkg from './package.json'
// Deal with https://github.com/rollup/rollup-plugin-commonjs/issues/297
import builtins from 'rollup-plugin-node-builtins';

export default {
  external: ['react', 'react-dom'],
  input: 'src/index.js',
  output: [
    {
        file: pkg.main,
        format: 'cjs',
        exports: 'named',
        sourcemap: true
    },
    {
      file: pkg.browser,
      format: 'umd',
      sourcemap: true,
      exports: 'named',
      name: 'OHIFStandaloneViewer',
      globals: {
        'react': 'React',
        'react-dom': 'ReactDOM',
        'cornerstone-core': 'cornerstone',
        'cornerstone-tools': 'cornerstoneTools',
        'cornerstone-math': 'cornerstoneMath',
        'dicom-parser': 'dicomParser'
      },
    },
    {
      file: pkg.module,
      format: 'es',
      exports: 'named',
      sourcemap: true,
    }
  ],
  plugins: [
    external(),
    postcss({
      modules: false
    }),
    url(),
    svgr(),
    json(),
    resolve(),
    babel({
      exclude: 'node_modules/**',
      runtimeHelpers: true
    }),
    commonjs({
        include: 'node_modules/**',
        namedExports: {
            'node_modules/react-is/index.js': ['isValidElementType'],
            'node_modules/redux-oidc/dist/redux-oidc.js': [
              'reducer', 'CallbackComponent', 'loadUser', 'OidcProvider', 'createUserManager'
            ]
        }
    }),
    builtins(),
  ]
}
