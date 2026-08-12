// https://babeljs.io/docs/en/options#babelrcroots

// React Compiler (babel-plugin-react-compiler) must run before any other
// transform so it sees the original JSX/hooks. REACT_COMPILER=off is a manual
// kill switch for debugging a suspected compiler miscompile; nothing in the
// repo sets it.
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
const enableReactCompiler = process.env.REACT_COMPILER !== 'off';
const reactCompilerPlugin = ['babel-plugin-react-compiler', { target: '19' }];

// Legacy platform/ui is frozen and outside the app graph, so it is not worth
// compiling. Kept here rather than in the package's build script so the policy
// lives with the transform and cannot be lost when a build script is copied.
// Mirrors the `(?!ui[\\/])` clause in rsbuild.config.ts's REACT_COMPILER_INCLUDE
// — note both patterns require a separator after `ui`, so platform/ui-next is
// compiled normally.
const reactCompilerExclude = [/[\\/]platform[\\/]ui[\\/]/];

// Individual files that must not be compiled carry a `'use no memo'` directive
// at the top of the file, next to the code and the reason - see the components
// under extensions/cornerstone/src/Viewport/, which read and mutate external
// cornerstone3D state during render. They stay directives rather than joining
// the exclude list above because a per-file path list has to be mirrored in
// rsbuild.config.ts and the two copies drift silently; one entry for one frozen
// package does not move.

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
  overrides: enableReactCompiler
    ? [{ exclude: reactCompilerExclude, plugins: [reactCompilerPlugin] }]
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
