// https://babeljs.io/docs/en/options#babelrcroots

// React Compiler (babel-plugin-react-compiler) must run before any other
// transform so it sees the original JSX/hooks. Which directories it applies to,
// and the REACT_COMPILER=off diagnostic switch, live in
// react-compiler.scope.cjs - shared with rsbuild, eslint and the coverage gate.
//
// The package (UMD) builds deliberately compile too, so the published bytes
// match what the app build produces. There was a thought to disable the
// compiler there on the theory that `react/compiler-runtime` escapes an
// `externals: { react: 'React' }` map (true — object externals match the
// specifier exactly) and drags in a second copy of React. Measured on
// platform/ui-next, the only package that externalizes React: it does not.
// react/compiler-runtime is 463 bytes whose sole dependency is
// `require('react')`, which *does* hit the external, so the emitted module is
// three lines reading useMemoCache off the host's React. Building with the
// compiler on vs. off differs by +3.2%, all of it memo-cache scaffolding, with
// no React version string, error text, or dispatcher in the output.
const compilerScope = require('./react-compiler.scope.cjs');
const reactCompilerPlugin = ['babel-plugin-react-compiler', { target: '19' }];

// Individual files that must not be compiled carry a `'use no memo'` directive
// at the top of the file, next to the code and the reason - see the components
// under extensions/cornerstone/src/Viewport/, which read and mutate external
// cornerstone3D state during render. Whole directories are excluded in
// react-compiler.scope.cjs instead, so every consumer of the decision agrees.

module.exports = {
  // Which packages may carry their own babel.config.js when built on their own.
  // Unrelated to react-compiler.scope.cjs, and deliberately wider: platform/ui
  // is built as a package but never compiled, so it belongs here and not there.
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
  overrides: compilerScope.enabled
    ? [{ test: [compilerScope.isCompiled], plugins: [reactCompilerPlugin] }]
    : [],
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
