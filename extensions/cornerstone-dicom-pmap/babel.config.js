module.exports = {
  plugins: ['@babel/plugin-transform-class-properties'],
  env: {
    test: {
      presets: [
        [
          // TODO: https://babeljs.io/blog/2019/03/19/7.4.0#migration-from-core-js-2
          '@babel/preset-env',
          {
            modules: 'commonjs',
            debug: false,
          },
          '@babel/preset-typescript',
        ],
        '@babel/preset-react',
      ],
      plugins: [
        '@babel/plugin-transform-object-rest-spread',
        '@babel/plugin-syntax-dynamic-import',
        '@babel/plugin-transform-regenerator',
        '@babel/plugin-transform-runtime',
      ],
    },
    production: {
      presets: [
        // WebPack handles ES6 --> Target Syntax
        ['@babel/preset-env', { modules: false }],
        '@babel/preset-react',
        '@babel/preset-typescript',
      ],
      ignore: ['**/*.test.jsx', '**/*.test.js', '__snapshots__', '__tests__'],
    },
    development: {
      presets: [
        // WebPack handles ES6 --> Target Syntax
        ['@babel/preset-env', { modules: false }],
        '@babel/preset-react',
        '@babel/preset-typescript',
      ],
      plugins: ['react-hot-loader/babel'],
      ignore: ['**/*.test.jsx', '**/*.test.js', '__snapshots__', '__tests__'],
    },
  },
};
