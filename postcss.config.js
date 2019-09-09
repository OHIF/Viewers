module.exports = function(ctx) {
  ctx = ctx || {};
  ctx.env = ctx.env || 'development';

  return {
    map: ctx.env === 'development' ? ctx.map : false,
    plugins: {
      'postcss-import': {},
      'postcss-preset-env': {},
      cssnano: ctx.env === 'production' ? {} : false,
    },
  };
};
