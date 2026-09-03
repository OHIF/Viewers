module.exports = function (ctx) {
  ctx = ctx || {};
  ctx.env = ctx.env || 'development';

  return {
    map: ctx.env === 'development' ? ctx.map : false,
    plugins: {
      'postcss-import': {},
      'postcss-preset-env': { autoprefixer: false },
      cssnano: ctx.env === 'production' ? {} : false,
    },
  };
};
