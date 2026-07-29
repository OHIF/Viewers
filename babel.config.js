// https://babeljs.io/docs/en/options#babelrcroots

// React Compiler (babel-plugin-react-compiler) must run before any other
// transform so it sees the original JSX/hooks. REACT_COMPILER=off is the
// kill switch; the UMD package builds set it because their externals list
// react/react-dom only, not react/compiler-runtime.
const enableReactCompiler = process.env.REACT_COMPILER !== 'off';
const reactCompilerPlugin = ['babel-plugin-react-compiler', { target: '19' }];

// Files that must not be compiled carry a `'use no memo'` directive at the top
// of the file, next to the code and the reason - see the components under
// extensions/cornerstone/src/Viewport/, which read and mutate external
// cornerstone3D state during render. A path-based exclusion here would have to
// be mirrored in rsbuild.config.ts, and the two copies drift silently.

module.exports = {
  babelrcRoots: ['./platform/*', './extensions/*', './modes/*'],
  presets: [
    '@babel/preset-env',
    ['@babel/preset-react', { runtime: 'automatic' }],
    '@babel/preset-typescript',
  ],
  plugins: [
    ['@babel/plugin-transform-class-properties', { loose: true }],
    '@babel/plugin-transform-typescript',
    ['@babel/plugin-transform-private-property-in-object', { loose: true }],
    ['@babel/plugin-transform-private-methods', { loose: true }],
    '@babel/plugin-transform-class-static-block',
  ],
  overrides: enableReactCompiler ? [{ plugins: [reactCompilerPlugin] }] : [],
  env: {
    test: {
      presets: [
        [
          // TODO: https://babeljs.io/blog/2019/03/19/7.4.0#migration-from-core-js-2
          '@babel/preset-env',
          {
            modules: 'commonjs',
            debug: false,
            targets: { node: 'current' },
            bugfixes: true,
          },
        ],
        ['@babel/preset-react', { runtime: 'automatic' }],
        '@babel/preset-typescript',
      ],
      plugins: [
        // jest's babel coverage provider injects babel-plugin-istanbul when
        // --collectCoverage is set; adding it here too makes babel 7 (pulled in
        // by jest 30) throw "Duplicate plugin/preset detected".
        '@babel/plugin-transform-object-rest-spread',
        '@babel/plugin-syntax-dynamic-import',
        '@babel/plugin-transform-regenerator',
        '@babel/transform-destructuring',
        '@babel/plugin-transform-runtime',
        '@babel/plugin-transform-typescript',
        '@babel/plugin-transform-class-static-block',
        '@babel/plugin-transform-for-of',
        ['babel-plugin-transform-import-meta', { module: 'ES6' }],
      ],
    },
    production: {
      presets: [
        // WebPack handles ES6 --> Target Syntax
        ['@babel/preset-env', { modules: false }],
        ['@babel/preset-react', { runtime: 'automatic' }],
        '@babel/preset-typescript',
      ],
      ignore: ['**/*.test.jsx', '**/*.test.js', '__snapshots__', '__tests__'],
    },
    development: {
      presets: [
        // WebPack handles ES6 --> Target Syntax
        ['@babel/preset-env', { modules: false }],
        ['@babel/preset-react', { runtime: 'automatic' }],
        '@babel/preset-typescript',
      ],
      ignore: ['**/*.test.jsx', '**/*.test.js', '__snapshots__', '__tests__'],
    },
  },
};
