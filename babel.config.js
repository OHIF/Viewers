module.exports = {
  babelrcRoots: ['./platform/*', './extensions/*', './modes/*'],
  presets: ['@babel/preset-env', '@babel/preset-react', '@babel/preset-typescript'],
  plugins: [
    ['@babel/plugin-proposal-class-properties', { loose: true }],
    '@babel/plugin-transform-typescript',
    ['@babel/plugin-proposal-private-property-in-object', { loose: true }],
    ['@babel/plugin-proposal-private-methods', { loose: true }],
    '@babel/plugin-transform-class-static-block',
  ],
  // 添加这个配置来处理 node_modules 中的特定包
  ignore: [/node_modules\/(?!(@cornerstonejs)\/).*/],
  env: {
    test: {
      presets: [
        [
          '@babel/preset-env',
          {
            modules: 'commonjs',
            debug: false,
          },
        ],
        '@babel/preset-react',
        '@babel/preset-typescript',
      ],
      plugins: [
        '@babel/plugin-proposal-object-rest-spread',
        '@babel/plugin-syntax-dynamic-import',
        '@babel/plugin-transform-regenerator',
        '@babel/transform-destructuring',
        '@babel/plugin-transform-runtime',
        '@babel/plugin-transform-typescript',
        '@babel/plugin-transform-class-static-block',
        '@babel/plugin-proposal-optional-chaining-assign',
      ],
    },
    production: {
      presets: [
        ['@babel/preset-env', { modules: false }],
        '@babel/preset-react',
        '@babel/preset-typescript',
      ],
      // 修改 ignore 让它处理 cornerstone 包
      ignore: [
        '**/*.test.jsx',
        '**/*.test.js',
        '__snapshots__',
        '__tests__',
        /node_modules\/(?!(@cornerstonejs)\/).*/,
      ],
    },
    development: {
      presets: [
        ['@babel/preset-env', { modules: false }],
        '@babel/preset-react',
        '@babel/preset-typescript',
      ],
      plugins: ['react-refresh/babel'],
      // 同样修改 development 环境的 ignore
      ignore: [
        '**/*.test.jsx',
        '**/*.test.js',
        '__snapshots__',
        '__tests__',
        /node_modules\/(?!(@cornerstonejs)\/).*/,
      ],
    },
  },
};
