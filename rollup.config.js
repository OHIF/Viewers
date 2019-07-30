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
import replace from 'rollup-plugin-replace';

const globals = {
  react: 'React',
  'react-dom': 'ReactDOM',
};

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
    replace({
      'process.env.NODE_ENV': JSON.stringify('production')
    }),
    postcss({
      modules: false,
    }),
    url(),
    svgr(),
    json(),
    builtins(),
    resolve(),
    babel({
      exclude: 'node_modules/**',
      runtimeHelpers: true,
    }),
    commonjs({
      sourceMap: false,
      include: 'node_modules/**',
      namedExports: {
        'node_modules/react/index.js': [
          'createContext',
          'createElement',
          'createRef',
          'cloneElement',
          'Children',
          'Fragment',
          'forwardRef',
          'useCallback',
          'isValidElement',
          'memo',
          'useContext',
          'useState',
          'useEffect',
          'useLayoutEffect',
          'Component',
          'PureComponent',
          'useRef',
          'useReducer',
          'useMemo',
        ],
        'node_modules/react-dom/index.js': [
          'unstable_batchedUpdates',
          'findDOMNode',
          'render',
        ],
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
        'node_modules/prop-types/index.js': ['oneOfType', 'element', 'bool', 'number', 'string', 'shape', 'func', 'any', 'node']
      },
    })
  ],
  external: Object.keys(pkg.peerDependencies || {}),
}
