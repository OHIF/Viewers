const tailwindcss = require('tailwindcss');
const commonConfigs = require('../../postcss.config.js');

module.exports = {
  ...commonConfigs,
  plugins: [
    tailwindcss('./src/gatsby-theme-docz/tailwind.js'),
    require('autoprefixer'),
  ],
};
