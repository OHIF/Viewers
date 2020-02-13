const tailwindcss = require('tailwindcss');
const configs = require('../../postcss.config.js');

module.exports = {
  ...configs,
  plugins: [tailwindcss('./tailwind.js'), require('autoprefixer')],
};
