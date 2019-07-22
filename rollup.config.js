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
import builtins from 'rollup-plugin-node-builtins'
import serve from 'rollup-plugin-serve'

const globals = {
  react: 'React',
  'react-dom': 'ReactDOM',
}

const startServer = process.env.START_SERVER === 'true';

export default {
  input: 'src/index_publish.js',
  output: [
    {
      file: pkg.main,
      format: 'umd',
      sourcemap: true,
      exports: 'named',
      name: 'OHIFStandaloneViewer',
      esModule: false,
      globals,
    },
    {
      file: pkg.module,
      format: 'es',
      exports: 'named',
      sourcemap: true,
      globals,
    },
  ],
  plugins: [
    external(),
    postcss({
      modules: false,
    }),
    url(),
    svgr(),
    json(),
    resolve({ preferBuiltins: true }),
    babel({
      exclude: 'node_modules/**',
      runtimeHelpers: true,
    }),
    commonjs({
      include: 'node_modules/**',
      namedExports: {
        'node_modules/react-is/index.js': [
          'isValidElementType',
          'isContextConsumer',
        ],
        'node_modules/redux-oidc/dist/redux-oidc.js': [
          'reducer',
          'CallbackComponent',
          'SignoutCallbackComponent',
          'loadUser',
          'OidcProvider',
          'createUserManager',
        ],
        'node_modules/oidc-client/lib/oidc-client.min.js': [
          'WebStorageStateStore',
          'InMemoryWebStorage',
        ],
        'node_modules/cornerstoneTools/dist/cornerstoneTools.min.js': [
          'cornerstoneTools',
        ],
        'node_modules/dcmjs/build/dcmjs.js': ['data', 'adapters'],
        'node_modules/prop-types/index.js': ['bool', 'number', 'string', 'shape', 'func', 'any', 'node']
      },
    }),
    builtins(),
    startServer && serve({
      open: true,
      // Multiple folders to serve from
      contentBase: ['.', 'dist', 'cypress/support/script-tag', 'public'],
      host: 'localhost',
      port: 5000,
    })
  ],
  external: Object.keys(pkg.peerDependencies || {}),
}
